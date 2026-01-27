# Fix: Navigation Handler Regression

**Branch:** `fix/navigation-handler-regression`
**Issue:** Tab merging behaves incorrectly when multiple tabs exist

## Problem Statement

When the extension is disabled with multiple Zendesk tabs open, then enabled and a new ticket link is opened:
- **Expected:** New tab routes to one existing tab, other tabs remain untouched
- **Actual:** Cascade of tab closures, only 1-2 tabs survive, content may be wrong/mixed

## Root Cause Analysis

### Current Implementation (BROKEN)

```typescript
// background.ts line 184
const updated = await updateTabUrl(existingTab.id, targetUrl);
```

Uses `chrome.tabs.update()` which:
1. Changes the browser URL directly
2. **Triggers a new navigation event** (`onBeforeNavigate`/`onCommitted`)
3. That navigation finds ANOTHER existing tab, routes to it
4. Cascade continues until almost all tabs are closed

### Legacy Implementation (CORRECT)

```javascript
// browser.js lines 71-76
updateLotusRoute: function(lotusTabId, route) {
    var message = { "target": "route", "memo": { "hash": route } };
    var codeToExecute = "window.postMessage('" + JSON.stringify(message) + "', '*')";
    this.tabs.executeScript(lotusTabId, codeToExecute);
}
```

Uses `window.postMessage()` via script injection which:
1. Sends a message to Zendesk's SPA router
2. Zendesk navigates **internally** (client-side)
3. **NO browser navigation event** is triggered
4. No cascade possible

### Why postMessage Works

Zendesk's agent interface is a Single Page Application (SPA) that listens for postMessage events:
- `{ "target": "route", "memo": { "hash": "/tickets/123" } }`
- The SPA updates its internal state and URL bar via History API
- This is the **intended routing mechanism** for Zendesk integrations

## Implementation Plan

### Task 1: Add scripting permission

**File:** `wxt.config.ts`

Add `scripting` to permissions array:
```typescript
permissions: ["webNavigation", "tabs", "storage", "scripting"],
```

The `scripting` permission is required for `chrome.scripting.executeScript()` in MV3.

### Task 2: Create updateLotusRoute function

**File:** `src/utils/tabs.ts`

Add new function matching legacy behavior:

```typescript
/**
 * Update Zendesk tab's route via postMessage to SPA.
 * This is the legacy routing mechanism that doesn't trigger navigation events.
 *
 * @param tabId - Tab ID to update
 * @param route - Route path (e.g., "/tickets/123")
 * @returns true if script executed successfully
 */
export async function updateLotusRoute(tabId: number, route: string): Promise<boolean> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (routePath: string) => {
        const message = { target: "route", memo: { hash: routePath } };
        window.postMessage(JSON.stringify(message), "*");
      },
      args: [route],
    });
    return true;
  } catch (error) {
    console.warn("QuickTab: Failed to update lotus route", tabId, error);
    return false;
  }
}
```

**MV3 Notes:**
- Must pass a function reference, not a string (MV3 restriction)
- Arguments passed via `args` array
- `chrome.scripting.executeScript` replaces `chrome.tabs.executeScript`

### Task 3: Update handleNavigation to use postMessage

**File:** `entrypoints/background.ts`

Replace `updateTabUrl()` with `updateLotusRoute()`:

```typescript
// Before (BROKEN):
const updated = await updateTabUrl(existingTab.id, targetUrl);

// After (CORRECT):
const updated = await updateLotusRoute(existingTab.id, match.path);
```

**Critical difference:** Pass `match.path` (e.g., `/tickets/123`), not the full URL.

### Task 4: Remove deduplication complexity

**File:** `entrypoints/background.ts`

The deduplication mechanism was added to work around the cascade issue. With postMessage:
- No navigation events are triggered by routing
- Deduplication becomes unnecessary for routing
- Keep it only for genuine double-fires from browser (rare)

Consider simplifying or removing `isDuplicateNavigation()` and `recentNavigations` map.

### Task 5: Match legacy tab detection logic

**File:** `entrypoints/background.ts`

Legacy validation (browser.js line 60):
```javascript
if (lotusTab.id !== tab.id && lotusTab.url.match(urlMatch.LOTUS_ROUTE))
```

Current validation:
```typescript
if (!isZendeskAgentUrl(tab.url)) continue;
```

Update `findExistingAgentTab()` to validate against LOTUS_ROUTE pattern, not just `/agent` prefix:

```typescript
// Validate URL matches LOTUS_ROUTE (agent interface, not chat/voice)
const lotusMatch = matchZendeskUrl(tab.url);
if (!lotusMatch || lotusMatch.type === "ticket") {
  // Only route to lotus tabs, not to tabs already showing tickets
  // This matches legacy behavior where target must match LOTUS_ROUTE
}
```

Actually, re-reading the legacy code - it accepts ANY lotus route match, including tickets. The key is just that it's a valid lotus route (agent interface). Let me reconsider...

The legacy LOTUS_ROUTE:
```regex
/^https?:\/\/(.*).zendesk.com\/agent\/(?!chat|voice)\#?\/?(.*)$/
```

This matches:
- `https://company.zendesk.com/agent/dashboard` ✓
- `https://company.zendesk.com/agent/tickets/123` ✓
- `https://company.zendesk.com/agent/chat` ✗

So any `/agent/*` URL except chat/voice is valid. Current `isZendeskAgentUrl()` is actually close, but doesn't exclude chat/voice. Update to:

```typescript
function isValidLotusRoute(url: string): boolean {
  const match = matchZendeskUrl(url);
  return match !== null; // matchZendeskUrl already excludes restricted routes
}
```

### Task 6: Update unit tests

**Files:**
- `src/utils/tabs.test.ts` - Add tests for `updateLotusRoute()`
- `entrypoints/background.test.ts` - Update navigation tests

Test cases:
1. `updateLotusRoute` executes script with correct message format
2. `updateLotusRoute` returns false on script execution failure
3. Navigation handler uses postMessage, not URL update
4. No cascade when routing to existing tab

### Task 7: Manual E2E testing

Cannot be fully automated - requires real Zendesk account.

**Test scenario:**
1. Open 6 Zendesk agent tabs (same subdomain)
2. Disable extension (set to noUrls)
3. Enable extension (set to allUrls)
4. Click a ticket link (from email, Slack, etc.)
5. **Expected:** New tab closes, one existing tab shows the ticket, other 5 tabs remain open

## Files Changed

| File | Change |
|------|--------|
| `wxt.config.ts` | Add `scripting` permission |
| `src/utils/tabs.ts` | Add `updateLotusRoute()` function |
| `entrypoints/background.ts` | Use `updateLotusRoute()` instead of `updateTabUrl()` |
| `src/utils/tabs.test.ts` | Add tests for new function |

## Risks & Mitigations

### Risk 1: postMessage format may have changed
- **Mitigation:** Test with actual Zendesk instance
- **Fallback:** If postMessage doesn't work, investigate Zendesk's current SPA API

### Risk 2: chrome.scripting.executeScript permissions
- **Mitigation:** Already have `host_permissions` for `*.zendesk.com`
- **Verification:** Test in Chrome to ensure script injection works

### Risk 3: Zendesk CSP may block postMessage
- **Mitigation:** postMessage to `'*'` origin should work (same as legacy)
- **Note:** Legacy has been working this way for years

## Success Criteria

- [ ] New ticket link routes to existing tab without cascade
- [ ] Other existing tabs remain open and unchanged
- [ ] Target tab navigates via SPA (no full page reload)
- [ ] Extension icon state updates correctly
- [ ] Unit tests pass
- [ ] No console errors during routing

## Commit Plan

1. `fix: add scripting permission for MV3 executeScript`
2. `fix: implement postMessage routing matching legacy behavior`
3. `test: add unit tests for updateLotusRoute`
4. `fix: use postMessage routing in navigation handler`

---
*Created: 2026-01-27*
*Status: Ready for implementation*

# Phase 2: Core Migration - Research

**Researched:** 2026-01-25
**Domain:** Chrome MV3 Service Worker Architecture, Storage-First State Management, TypeScript URL Matching
**Confidence:** HIGH

## Summary

This phase migrates the service worker (tabWatcher.js) and URL matching logic (url_match.js) from legacy ES5/CommonJS to modern TypeScript with a storage-first architecture. The core challenge is adapting to MV3 service worker lifecycle where workers terminate after 30 seconds of inactivity, requiring persistent state via chrome.storage.local.

Chrome MV3 mandates synchronous event listener registration at module scope (not inside async functions or callbacks). The existing code registers listeners synchronously but relies on global state that will be lost on worker termination. The migration must restructure to read state from storage on each listener invocation.

The URL matching logic is straightforward regex-based pattern matching that ports directly to TypeScript. The native URL constructor plus optional URLPattern API (Baseline 2025) provide modern alternatives to manual regex parsing for subdomain extraction.

**Primary recommendation:** Use WXT's `defineBackground()` with synchronous listener registration at module scope. Store tab tracking state in chrome.storage.local using a typed wrapper. Port URL matching to a pure TypeScript module using native URL constructor for parsing and typed regex patterns for Zendesk route detection.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| [WXT](https://wxt.dev/) | ^0.20.13 | Extension framework | Already configured in Phase 1; provides defineBackground() |
| [TypeScript](https://www.typescriptlang.org/) | ^5.9.3 | Type-safe code | Already configured in Phase 1 |
| [@types/chrome](https://www.npmjs.com/package/@types/chrome) | ^0.0.287 | Chrome API types | Already configured in Phase 1; provides full type coverage |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native URL constructor | ES6+ | URL parsing | Always - built-in, zero dependencies |
| URLPattern API | Baseline 2025 | Pattern matching | Optional - for complex matching; browser built-in |
| WXT storage utils | ^0.20.13 | Storage wrapper | Optional - use only if vanilla chrome.storage proves cumbersome |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native URL + regex | url-pattern npm | Adds dependency; native URL handles subdomain extraction well |
| Native URL + regex | tldts npm | Overkill for single-domain matching (zendesk.com only) |
| chrome.storage.local | chrome.storage.session | session doesn't survive worker termination - contradicts storage-first architecture |
| chrome.storage.local | IndexedDB | More complex API; chrome.storage sufficient for small tab tracking data |

**Installation:**
No additional dependencies required - Phase 1 established the necessary tooling.

## Architecture Patterns

### Recommended Project Structure

Per CONTEXT.md decisions, shared utilities go in `src/utils/`:

```
entrypoints/
├── background.ts         # Service worker - orchestrates event handling
src/
├── utils/
│   ├── url-matching.ts   # URL pattern detection logic
│   ├── storage.ts        # Type-safe chrome.storage wrapper
│   ├── tabs.ts           # Type-safe chrome.tabs wrapper
│   └── types.ts          # Shared type definitions
```

### Pattern 1: Storage-First Service Worker

**What:** Load state from storage at start of each event handler, save after modifications
**When to use:** Any service worker state that must survive termination
**Example:**
```typescript
// Source: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle
// entrypoints/background.ts

interface TabTrackingState {
  zendeskTabs: Map<number, { subdomain: string; lastActive: number }>;
}

const STORAGE_KEY = 'quicktab_state';

async function loadState(): Promise<TabTrackingState> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY];
  return stored ?? { zendeskTabs: new Map() };
}

async function saveState(state: TabTrackingState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

export default defineBackground(() => {
  // Register ALL listeners synchronously at module scope
  chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    const state = await loadState();  // Load fresh state each time
    // ... handle navigation
    await saveState(state);  // Persist changes
  }, { url: [{ hostSuffix: 'zendesk.com' }] });
});
```

### Pattern 2: Synchronous Event Listener Registration

**What:** Register all chrome.* event listeners in the first event loop tick
**When to use:** Every service worker background script
**Example:**
```typescript
// Source: https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers

// CORRECT - listeners at module scope, async work inside handlers
export default defineBackground(() => {
  chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    // Async work OK inside handler
    const settings = await chrome.storage.local.get('urlDetection');
    // ...
  }, { url: [{ hostSuffix: 'zendesk.com' }] });

  chrome.webNavigation.onCommitted.addListener(async (details) => {
    // ...
  }, { url: [{ hostSuffix: 'zendesk.com' }] });

  chrome.runtime.onInstalled.addListener((details) => {
    // ...
  });
});

// WRONG - listeners inside async function
export default defineBackground(async () => {  // NEVER async
  await someSetup();  // Worker may terminate before reaching listeners
  chrome.webNavigation.onBeforeNavigate.addListener(...);  // TOO LATE
});
```

### Pattern 3: Type-Safe Chrome API Wrapper

**What:** Thin wrapper functions that add TypeScript types to chrome.* APIs
**When to use:** Frequently used APIs (storage, tabs, webNavigation)
**Example:**
```typescript
// src/utils/storage.ts
// Source: https://developer.chrome.com/docs/extensions/reference/api/storage

interface StorageSchema {
  urlDetection: 'allUrls' | 'ticketUrls' | 'noUrls';
  zendeskTabs: Record<number, ZendeskTabInfo>;
}

export async function getStorageItem<K extends keyof StorageSchema>(
  key: K
): Promise<StorageSchema[K] | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key];
}

export async function setStorageItem<K extends keyof StorageSchema>(
  key: K,
  value: StorageSchema[K]
): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}
```

### Pattern 4: URL Matching with Native URL Constructor

**What:** Parse URLs with native URL constructor, match routes with typed regex
**When to use:** All URL pattern detection
**Example:**
```typescript
// src/utils/url-matching.ts
// Per CONTEXT.md: ignore query params, hash fragments; match any subdomain

interface RouteMatch {
  subdomain: string;
  path: string;
  type: 'lotus' | 'ticket';
}

const LOTUS_ROUTE = /^\/agent\/(?!chat|voice)(.*)$/;
const TICKET_ROUTE = /^\/(?:agent\/tickets|tickets|twickets|requests|hc\/requests)\/(.*)$/;
const RESTRICTED_ROUTE = /^\/(agent\/(chat|talk|admin\/voice)|tickets\/\d+\/print)/;

export function matchZendeskUrl(urlString: string): RouteMatch | null {
  const url = new URL(urlString);

  // Verify zendesk.com domain (any subdomain)
  if (!url.hostname.endsWith('.zendesk.com')) {
    return null;
  }

  // Extract subdomain (everything before .zendesk.com)
  const subdomain = url.hostname.replace('.zendesk.com', '');

  // Ignore query params and hash per CONTEXT.md
  const pathname = url.pathname;

  // Check restricted routes first
  if (RESTRICTED_ROUTE.test(pathname)) {
    return null;
  }

  // Try ticket route (higher priority per existing logic)
  const ticketMatch = pathname.match(TICKET_ROUTE);
  if (ticketMatch) {
    return { subdomain, path: `/tickets/${ticketMatch[1]}`, type: 'ticket' };
  }

  // Try lotus route
  const lotusMatch = pathname.match(LOTUS_ROUTE);
  if (lotusMatch) {
    return { subdomain, path: `/${lotusMatch[1]}`, type: 'lotus' };
  }

  return null;
}
```

### Anti-Patterns to Avoid

- **Global state variables:** Service worker terminates; use chrome.storage.local instead
- **Async event listener registration:** Listeners registered after first event loop tick may miss events
- **Relying on setTimeout/setInterval:** Timers canceled on termination; use chrome.alarms if needed
- **Storing complex objects in storage:** JSON serialization required; Maps become plain objects
- **Not validating tab existence:** Tab may be closed between events; check chrome.tabs.get

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL parsing | Custom regex for protocol/host/path | `new URL(string)` | Handles edge cases, encoding, ports |
| Subdomain extraction | Custom regex | `url.hostname.replace('.zendesk.com', '')` | Simpler, handles subdomains correctly |
| Storage serialization | Custom JSON wrappers | chrome.storage.local (auto-serializes) | Built-in, handles edge cases |
| Tab existence check | Assume tab exists | `chrome.tabs.get(tabId)` in try/catch | Tab may close between events |
| Promise-based chrome APIs | Callback wrappers | Chrome MV3 APIs are Promise-native | Native since MV3 |

**Key insight:** Chrome MV3 APIs are Promise-based natively. The @types/chrome package provides full type coverage. Avoid callback-style code or wrapper libraries designed for MV2.

## Common Pitfalls

### Pitfall 1: Service Worker Terminates Mid-Operation

**What goes wrong:** Long-running operations (>30s) or operations after 30s idle cause data loss
**Why it happens:** Chrome terminates service workers after 30 seconds of inactivity or if single request exceeds 5 minutes
**How to avoid:** Keep operations short; save state immediately after changes; don't rely on in-memory state
**Warning signs:** State lost after Chrome sits idle; operations silently fail

```typescript
// WRONG - state lost on termination
let cachedTabs: Map<number, TabInfo> = new Map();

// CORRECT - state persisted immediately
chrome.webNavigation.onCommitted.addListener(async (details) => {
  const state = await loadState();
  state.zendeskTabs.set(details.tabId, { /* ... */ });
  await saveState(state);  // Save immediately
});
```

### Pitfall 2: Event Listeners Not Registered

**What goes wrong:** Extension doesn't respond to navigation events
**Why it happens:** Listeners registered inside async function, promise, or callback
**How to avoid:** All `chrome.*.addListener()` calls must be synchronous in module scope
**Warning signs:** DevTools shows "Service Worker" but no logs from listeners

```typescript
// WRONG - listener registered too late
export default defineBackground(async () => {
  const config = await loadConfig();  // Worker terminates before next line
  chrome.webNavigation.onBeforeNavigate.addListener(...);  // Never reached
});

// CORRECT - synchronous registration
export default defineBackground(() => {
  chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    const config = await loadConfig();  // Async work OK inside handler
    // ...
  });
});
```

### Pitfall 3: Tab No Longer Exists

**What goes wrong:** `chrome.tabs.update()` or `chrome.tabs.remove()` fails silently
**Why it happens:** Tab closed between navigation event and handler execution
**How to avoid:** Always wrap tab operations in try/catch; validate tab exists; clean up stale state
**Warning signs:** Extension sometimes doesn't route to expected tab; console errors about tab ID

```typescript
// CORRECT - defensive tab handling
async function focusTab(tabId: number): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId);
    await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
    return true;
  } catch {
    // Tab no longer exists - clean up from storage
    const state = await loadState();
    delete state.zendeskTabs[tabId];
    await saveState(state);
    return false;
  }
}
```

### Pitfall 4: Map Serialization in Storage

**What goes wrong:** Map becomes empty object `{}` after storage round-trip
**Why it happens:** JSON.stringify(map) produces `{}` for Maps
**How to avoid:** Use plain objects or convert Map to array of entries before storage
**Warning signs:** State appears empty after worker restart despite saving

```typescript
// WRONG - Map doesn't survive JSON serialization
interface State { tabs: Map<number, TabInfo>; }
await chrome.storage.local.set({ state: { tabs: new Map() } });  // Becomes { tabs: {} }

// CORRECT - use Record (plain object)
interface State { tabs: Record<number, TabInfo>; }

// OR convert Map to entries
const entries = Array.from(map.entries());
await chrome.storage.local.set({ entries });
// Restore: new Map(entries)
```

### Pitfall 5: Stale Event Listeners on Update

**What goes wrong:** Old listener behavior persists after extension update
**Why it happens:** Chrome keeps old service worker active until all tabs using it close
**How to avoid:** Handle chrome.runtime.onInstalled with reason 'update' to reset state if needed
**Warning signs:** New code doesn't seem to execute; old behavior continues

```typescript
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'update') {
    // Reset state on extension update per CONTEXT.md decision
    chrome.storage.local.remove('quicktab_state');
    console.log('QuickTab updated - state reset');
  }
});
```

## Code Examples

Verified patterns from official sources:

### Complete Background Script Structure

```typescript
// entrypoints/background.ts
// Source: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle

import { matchZendeskUrl } from '@/utils/url-matching';
import { loadState, saveState, getUrlDetection } from '@/utils/storage';
import { focusTab, updateTabUrl, closeTab, queryZendeskTabs } from '@/utils/tabs';

export default defineBackground(() => {
  // Console log for lifecycle debugging per CONTEXT.md
  console.log('QuickTab service worker started', { id: browser.runtime.id });

  // Register all listeners synchronously at module scope

  // Handle installation and updates
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
      // Open welcome page
      const welcomeUrl = chrome.runtime.getURL('/welcome.html');
      await chrome.tabs.create({ url: welcomeUrl });
    }

    if (details.reason === 'update') {
      // Reset state on update per CONTEXT.md
      await chrome.storage.local.remove('quicktab_state');
    }

    // Re-detect Zendesk tabs after install/update
    const tabs = await queryZendeskTabs();
    // ... populate state
  });

  // Main navigation interception
  chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    // Only handle main frame navigation
    if (details.frameId !== 0) return;

    const detection = await getUrlDetection();
    if (detection === 'noUrls') return;

    const match = matchZendeskUrl(details.url);
    if (!match) return;

    // For ticketUrls mode, only intercept ticket routes
    if (detection === 'ticketUrls' && match.type !== 'ticket') return;

    await handleNavigation(details.tabId, match);
  }, { url: [{ hostSuffix: 'zendesk.com' }] });

  // Backup listener for redirects
  chrome.webNavigation.onCommitted.addListener(async (details) => {
    if (details.frameId !== 0) return;
    // Same logic as onBeforeNavigate
    // ...
  }, { url: [{ hostSuffix: 'zendesk.com' }] });

  // Page action for agent pages
  chrome.webNavigation.onDOMContentLoaded.addListener(async (details) => {
    if (details.frameId !== 0) return;
    // Show page action icon
    // ...
  }, { url: [{ urlContains: 'zendesk.com/agent' }] });
});

async function handleNavigation(sourceTabId: number, match: RouteMatch): Promise<void> {
  const state = await loadState();

  // Find existing tab for this subdomain
  const existingTab = findMostRecentTab(state, match.subdomain);

  if (existingTab && existingTab.tabId !== sourceTabId) {
    // Route to existing tab per CONTEXT.md
    await updateTabUrl(existingTab.tabId, buildZendeskUrl(match));
    await focusTab(existingTab.tabId);
    await closeTab(sourceTabId);
  }
}
```

### Type-Safe Storage Wrapper

```typescript
// src/utils/storage.ts
// Source: https://developer.chrome.com/docs/extensions/reference/api/storage

export interface ZendeskTabInfo {
  subdomain: string;
  lastActive: number;  // Timestamp for "most recently active" per CONTEXT.md
}

interface StorageSchema {
  urlDetection: 'allUrls' | 'ticketUrls' | 'noUrls';
  quicktab_state: {
    zendeskTabs: Record<number, ZendeskTabInfo>;
  };
}

const DEFAULT_STATE: StorageSchema['quicktab_state'] = {
  zendeskTabs: {},
};

export async function loadState(): Promise<StorageSchema['quicktab_state']> {
  try {
    const result = await chrome.storage.local.get('quicktab_state');
    return result.quicktab_state ?? DEFAULT_STATE;
  } catch (error) {
    // Silent fallback to memory per CONTEXT.md
    console.warn('Storage read failed, using default state', error);
    return DEFAULT_STATE;
  }
}

export async function saveState(
  state: StorageSchema['quicktab_state']
): Promise<void> {
  try {
    await chrome.storage.local.set({ quicktab_state: state });
  } catch (error) {
    // Silent fallback per CONTEXT.md - state won't persist but extension works
    console.warn('Storage write failed', error);
  }
}

export async function getUrlDetection(): Promise<StorageSchema['urlDetection']> {
  const result = await chrome.storage.local.get('urlDetection');
  return result.urlDetection ?? 'allUrls';
}
```

### Type-Safe Tabs Wrapper

```typescript
// src/utils/tabs.ts
// Source: https://developer.chrome.com/docs/extensions/reference/api/tabs

export async function focusTab(tabId: number): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId);
    await chrome.tabs.update(tabId, { active: true, highlighted: true });
    await chrome.windows.update(tab.windowId, { focused: true });
    return true;
  } catch {
    return false;  // Tab no longer exists
  }
}

export async function updateTabUrl(tabId: number, url: string): Promise<boolean> {
  try {
    await chrome.tabs.update(tabId, { url });
    return true;
  } catch {
    return false;
  }
}

export async function closeTab(tabId: number): Promise<void> {
  try {
    await chrome.tabs.remove(tabId);
  } catch {
    // Tab already closed - ignore
  }
}

export async function queryZendeskTabs(): Promise<chrome.tabs.Tab[]> {
  return chrome.tabs.query({ url: '*://*.zendesk.com/agent/*' });
}

export async function injectScript(
  tabId: number,
  func: (...args: unknown[]) => void,
  args: unknown[] = []
): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId },
    func,
    args,
  });
}
```

### URL Matching Module

```typescript
// src/utils/url-matching.ts
// Per CONTEXT.md: ignore query params, hash; match any subdomain; unified matching

export interface RouteMatch {
  subdomain: string;
  path: string;
  type: 'lotus' | 'ticket';
}

// Patterns from existing url_match.js, converted to TypeScript
const LOTUS_ROUTE = /^\/agent\/(?!chat|voice)(.*)$/;
const TICKET_ROUTE = /^\/(?:agent\/tickets|tickets|twickets|requests|hc\/requests)\/(.*)$/;
const RESTRICTED_ROUTE = /^\/(agent\/(chat|talk|admin\/voice)|tickets\/\d+\/print)/;

export function matchZendeskUrl(urlString: string): RouteMatch | null {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return null;  // Invalid URL
  }

  // Must be zendesk.com domain
  if (!url.hostname.endsWith('.zendesk.com')) {
    return null;
  }

  // Extract subdomain
  const subdomain = url.hostname.slice(0, -'.zendesk.com'.length);
  if (!subdomain) {
    return null;  // Root domain without subdomain
  }

  // Use pathname only - ignoring query params and hash per CONTEXT.md
  const pathname = url.pathname;

  // Check restricted routes first (chat, voice, print)
  if (RESTRICTED_ROUTE.test(pathname)) {
    return null;
  }

  // Try ticket route (higher priority per existing logic)
  const ticketMatch = pathname.match(TICKET_ROUTE);
  if (ticketMatch) {
    const path = ticketMatch[1]?.replace('#/', '') ?? '';
    return { subdomain, path: `/tickets/${path}`, type: 'ticket' };
  }

  // Try lotus route
  const lotusMatch = pathname.match(LOTUS_ROUTE);
  if (lotusMatch) {
    const path = lotusMatch[1]?.replace('#/', '') ?? '';
    return { subdomain, path: `/${path}`, type: 'lotus' };
  }

  return null;
}

export function buildZendeskUrl(match: RouteMatch): string {
  return `https://${match.subdomain}.zendesk.com/agent${match.path}`;
}

export function isZendeskAgentUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith('.zendesk.com') &&
           parsed.pathname.startsWith('/agent');
  } catch {
    return false;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Global variables in background page | chrome.storage.local + load-on-demand | MV3 (2021+) | State survives worker termination |
| Callback-style chrome APIs | Promise-native chrome APIs | MV3 (2021+) | Cleaner async/await code |
| Manual URL parsing with regex | Native URL constructor + regex for routes | ES6 (2015) | Better edge case handling |
| localStorage in background | chrome.storage.local only | MV3 service workers | localStorage unavailable in workers |
| Persistent background page | Event-driven service worker | MV3 (2021+) | Lower memory usage, forced state persistence |
| webextension-polyfill | Direct chrome.* APIs with @types/chrome | MV3 + WXT | Simpler, Promise-native, better types |

**Deprecated/outdated:**
- **localStorage in service workers:** Not available; use chrome.storage
- **Callback-style chrome APIs:** MV3 APIs are Promise-native
- **Persistent background pages:** Deprecated in MV3
- **chrome.browserAction:** Replaced by chrome.action in MV3
- **tabs.executeScript:** Replaced by scripting.executeScript in MV3

## Open Questions

Things that couldn't be fully resolved:

1. **Tab tracking granularity**
   - What we know: CONTEXT.md says persist tab tracking only; can rebuild from chrome.tabs if needed
   - What's unclear: Exact data structure - should we track tab-to-subdomain mapping or just tab IDs?
   - Recommendation: Store minimal data - just `Record<tabId, { subdomain, lastActive }>`. Validate tabs exist on use.

2. **Multiple windows handling**
   - What we know: CONTEXT.md says "focus only - bring window to front, don't move tabs"
   - What's unclear: If user has same subdomain in multiple windows, which tab wins?
   - Recommendation: Use most recently active (highest lastActive timestamp) regardless of window.

3. **Race conditions between onBeforeNavigate and onCommitted**
   - What we know: Both events can trigger for same navigation; one for initial, one for redirects
   - What's unclear: Whether both handlers might process same navigation simultaneously
   - Recommendation: Add early return if tab already being processed; use transactionId if available.

## Sources

### Primary (HIGH confidence)
- [Extension Service Worker Lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle) - Termination, state persistence
- [Migrate to a Service Worker](https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers) - Event listener registration patterns
- [chrome.storage API](https://developer.chrome.com/docs/extensions/reference/api/storage) - Storage methods, quotas, events
- [chrome.webNavigation API](https://developer.chrome.com/docs/extensions/reference/api/webNavigation) - Event order, filters, details object
- [chrome.tabs API](https://developer.chrome.com/docs/extensions/reference/api/tabs) - Tab methods, events, properties
- [WXT Entrypoints](https://wxt.dev/guide/essentials/entrypoints.html) - defineBackground() usage
- [WXT Extension APIs](https://wxt.dev/guide/essentials/extension-apis.html) - browser vs chrome

### Secondary (MEDIUM confidence)
- [Accessibility Insights MV3 Migration](https://devblogs.microsoft.com/engineering-at-microsoft/learnings-from-migrating-accessibility-insights-for-web-to-chromes-manifest-v3/) - Real-world migration learnings
- [URL Pattern API MDN](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API) - URLPattern syntax (Baseline 2025)
- [MV3 Service Worker Discussions](https://groups.google.com/a/chromium.org/g/chromium-extensions/) - Common pitfalls, edge cases

### Tertiary (LOW confidence)
- Various blog posts about MV3 migration - Patterns verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies needed; Phase 1 tooling sufficient
- Architecture: HIGH - Chrome official docs clearly describe patterns
- Pitfalls: HIGH - Well-documented in Chrome docs and migration guides
- URL Matching: HIGH - Direct port of existing logic with native URL constructor

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - Chrome APIs stable, patterns well-established)

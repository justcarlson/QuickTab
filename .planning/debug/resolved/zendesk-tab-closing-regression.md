---
status: resolved
trigger: "QuickTab is incorrectly closing ALL zendesk.com tabs and collapsing into wrong (non-Zendesk) tabs, instead of only merging the newly opened tab with the last tab."
created: 2026-01-25T21:10:00Z
updated: 2026-01-25T21:30:00Z
---

## Current Focus

hypothesis: CONFIRMED - Fix implemented, all tests pass, build succeeds
test: 90 unit tests pass, lint passes, build succeeds
expecting: Behavior now matches original - only source tab + one target affected
next_action: N/A - Debug complete

## Symptoms

expected: When clicking a link that opens a new tab, QuickTab should merge ONLY the NEW OPENED tab + the LAST tab of the same domain. Other tabs should remain untouched.
actual: QuickTab is closing ALL zendesk.com tabs AND collapsing tabs into non-Zendesk tabs (wrong grouping).
errors: No console errors visible - tabs close silently
reproduction: Open multiple zendesk tabs, click a link that triggers QuickTab merge behavior
started: Regression - this doesn't match the original extension behavior

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-01-25T21:10:00Z
  checked: Original implementation in app/javascripts/modules/browser.js
  found: |
    Original openRouteInZendesk() logic at line 56-76:
    1. Queries tabs matching '*://' + subdomain + '.zendesk.com/agent/*'
    2. Loops through openTabs looking for first tab that:
       - Has different ID than source tab (lotusTab.id !== tab.id)
       - URL matches LOTUS_ROUTE regex (agent interface)
    3. When found: updates route via executeScript, focuses tab, removes source tab
    4. Uses BREAK to stop after first match - only ONE tab affected
  implication: Original finds FIRST matching agent tab and breaks - only affects source + one target

- timestamp: 2026-01-25T21:11:00Z
  checked: New implementation in entrypoints/background.ts handleNavigation()
  found: |
    New handleNavigation() logic at line 104-149:
    1. Uses findMostRecentTab() which iterates through state.zendeskTabs
    2. findMostRecentTab returns single tab ID
    3. Updates URL directly via chrome.tabs.update (not executeScript)
    4. Closes source tab

    CRITICAL DIFFERENCE: The navigation handlers fire on BOTH onBeforeNavigate (line 248)
    AND onCommitted (line 271). Both call handleNavigation() with the same tab.
  implication: Double-firing could cause repeated processing of the same navigation

- timestamp: 2026-01-25T21:12:00Z
  checked: Original tab query vs new tab tracking
  found: |
    ORIGINAL: Queries LIVE tabs with chrome.tabs.query('*://' + subdomain + '.zendesk.com/agent/*')
    NEW: Uses cached state.zendeskTabs from storage

    The original ALWAYS queries current browser state.
    The new code relies on tracked state which may be stale or include closed tabs.
  implication: Stale state could reference non-existent tabs or cause misrouting

- timestamp: 2026-01-25T21:13:00Z
  checked: Original LOTUS_ROUTE matching requirement
  found: |
    Original line 67: `if (lotusTab.id !== tab.id && lotusTab.url.match(urlMatch.LOTUS_ROUTE))`

    The original REQUIRES the target tab to match LOTUS_ROUTE regex:
    /^https?:\/\/(.*).zendesk.com\/agent\/(?!chat|voice)\#?\/?(.*)$/

    This means target must be on the /agent/* path (not just any zendesk.com page).

    NEW code in findMostRecentTab() only checks subdomain match - no URL validation!
  implication: NEW code could route to ANY zendesk page, not just agent interface tabs

- timestamp: 2026-01-25T21:14:00Z
  checked: Root cause of "closing ALL tabs" symptom
  found: |
    The double-firing (onBeforeNavigate + onCommitted) combined with how state is managed
    could cause cascade effects:

    1. onBeforeNavigate fires: handleNavigation closes source tab, updates state
    2. onCommitted fires: But source tab is already closing/closed, state may be inconsistent

    Also: if state.zendeskTabs contains stale entries from tabs that were closed
    but not cleaned up properly, findMostRecentTab could return invalid targets.

    When updateTabUrl returns false (tab doesn't exist), the code at line 133-139
    removes the stale entry but then tracks the SOURCE tab - which may already be in
    process of being closed from a previous handler call.
  implication: Race condition between handlers and stale state tracking is likely causing the "all tabs" issue

## Resolution

root_cause: |
  THREE ISSUES IDENTIFIED:

  1. DOUBLE-FIRING: Both onBeforeNavigate AND onCommitted call handleNavigation()
     without any deduplication. The same navigation gets processed twice, potentially
     causing double closes or state corruption.

  2. MISSING URL VALIDATION: Original required target tab to match LOTUS_ROUTE
     (must be on /agent/* path). New code only checks subdomain, so it could route
     to ANY zendesk.com page including non-agent pages.

  3. LIVE QUERY vs STALE STATE: Original always queried current browser state.
     New code uses cached state that may be stale or include closed tabs.

fix: |
  1. Added navigation deduplication using in-memory Map with 1-second window:
     - isDuplicateNavigation() tracks "tabId:url" -> timestamp
     - Both onBeforeNavigate and onCommitted now check this before processing
     - Prevents double-firing from causing multiple closes

  2. Replaced findMostRecentTab() with findExistingAgentTab():
     - Now queries LIVE tabs with chrome.tabs.query() using subdomain-specific pattern
     - Pattern: `*://${subdomain}.zendesk.com/agent/*` (matches original behavior)
     - Additional validation with isZendeskAgentUrl() for defense in depth
     - Storage state only used for lastActive timestamps to pick "most recent"

  3. Simplified error handling:
     - If updateTabUrl() fails, source tab just continues (no stale state tracking)
     - Cleaner state management - only track tabs that exist

verification: |
  - All 90 unit tests pass
  - Build succeeds (5.5 kB background.js)
  - Lint passes
  - Awaiting user verification with real Zendesk tabs

files_changed:
  - /home/jc/developer/QuickTab/entrypoints/background.ts

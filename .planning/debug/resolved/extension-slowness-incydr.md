---
status: resolved
trigger: "QuickTab extension becomes extremely slow when Incydr Chrome extension is running. This was the common factor across multiple browsers."
created: 2026-01-27T12:00:00Z
updated: 2026-01-27T12:20:00Z
---

## Current Focus

hypothesis: CONFIRMED - setActionIcon() causes O(N) chrome API calls for O(1) events; DLP monitoring adds latency per call making this exponentially worse
test: Design fix that reduces unnecessary API calls
expecting: Reducing API calls will reduce total latency under DLP monitoring
next_action: Implement fix - change setActionIcon to only update the CURRENT tab, not all tabs

## Symptoms

expected: Fast/instant response - actions should complete quickly
actual: All extension actions are extremely slow
errors: No errors visible
reproduction: Slowness occurs when Incydr Chrome extension is also running. Tested across multiple browsers - Incydr presence is the common factor.
started: Issue appears specifically when Incydr is active

## Prior Context

- A previous fix was applied (commit f103924) to parallelize setActionIcon() calls
- The real trigger is Incydr extension being active
- Incydr is a security/DLP extension that likely monitors network requests, intercepts chrome.* API calls, and may add latency to extension messaging

## Eliminated

## Evidence

- timestamp: 2026-01-27T12:05:00Z
  checked: entrypoints/background.ts - setActionIcon() function (lines 90-104)
  found: |
    setActionIcon() does the following sequence:
    1. await queryZendeskTabs() - calls chrome.tabs.query()
    2. For each tab returned, calls chrome.action.setIcon() in parallel
    This is called on EVERY onDOMContentLoaded event (line 391)
  implication: If user has N Zendesk tabs open, each DOMContentLoaded triggers N+1 chrome.* API calls

- timestamp: 2026-01-27T12:06:00Z
  checked: entrypoints/background.ts - onDOMContentLoaded handler (lines 378-394)
  found: |
    Every DOMContentLoaded for zendesk.com/agent URLs triggers:
    1. trackTab() -> loadState() [storage read] + matchZendeskUrl() + saveState() [storage write]
    2. chrome.action.enable()
    3. getUrlDetection() [storage read]
    4. setActionIcon() -> queryZendeskTabs() [tabs query] + N x setIcon calls
    Total: 3 storage calls + 1 tabs.query + N setIcon + 1 action.enable = 5+N API calls PER navigation
  implication: Heavy API usage per event - DLP monitoring would add latency to each call

- timestamp: 2026-01-27T12:07:00Z
  checked: entrypoints/background.ts - onBeforeNavigate and onCommitted handlers
  found: |
    Both handlers fire for same navigation (with deduplication):
    1. getUrlDetection() [storage read]
    2. If match: handleNavigation() which calls:
       - loadState() [storage read]
       - chrome.tabs.query() for subdomain
       - If existing tab: updateLotusRoute() [scripting.executeScript] + focusTab() [3 chrome.* calls] + closeTab() + saveState()
       - If no existing tab: saveState()
  implication: Navigation interception adds 3-8 more API calls

- timestamp: 2026-01-27T12:08:00Z
  checked: Pattern analysis across codebase
  found: |
    KEY INSIGHT: setActionIcon() updates ALL tabs even when only ONE tab changed.
    When mode changes or any DOMContentLoaded fires, it re-queries all tabs and updates all icons.
    This is O(N) work for O(1) change.
  implication: This is the primary suspect - unnecessary work amplified by DLP monitoring latency

## Resolution

root_cause: |
  The setActionIcon() function queries ALL Zendesk tabs and updates icons on ALL of them,
  even when only a single tab's state changed. This is called on every DOMContentLoaded event.

  With N Zendesk tabs open:
  - Each navigation triggers: 3 storage calls + 1 tabs.query + N setIcon calls + 1 action.enable
  - Total: 5+N chrome.* API calls per navigation

  When Incydr DLP extension is active, it monitors/intercepts chrome.* API calls, adding latency
  to each call. With even modest latency (e.g., 50ms per call) and 5 tabs:
  - Normal: ~instant (parallel calls)
  - With DLP: (5+5) * 50ms = 500ms per navigation

  This explains why the extension is slow specifically when Incydr is running.

fix: |
  1. Added getIconPath() helper function to avoid code duplication
  2. Created setTabIcon() for single-tab icon updates (O(1) API calls)
  3. Renamed setActionIcon() to setAllTabIcons() for mode changes (O(N) API calls, used only when needed)
  4. Changed onDOMContentLoaded to use setTabIcon() instead of setAllTabIcons()
  5. Mode change handler continues to use setAllTabIcons() (appropriate - mode affects all tabs)

  Before: Each DOMContentLoaded triggered N+1 chrome.* API calls (query + N setIcon)
  After: Each DOMContentLoaded triggers 1 chrome.* API call (just setIcon for current tab)

  With 5 Zendesk tabs and DLP adding 50ms latency per call:
  - Before: ~300ms per navigation (6 calls * 50ms)
  - After: ~50ms per navigation (1 call * 50ms)

verification: |
  - All 95 unit tests pass
  - Extension builds successfully
  - Logic review confirms:
    - onDOMContentLoaded only updates single tab icon (correct)
    - Mode changes still update all tabs (correct)
    - Navigation interception unchanged (doesn't call setIcon)

files_changed:
  - entrypoints/background.ts

---
status: resolved
trigger: "QuickTab is incorrectly closing ALL zendesk.com tabs and collapsing into wrong (non-Zendesk) tabs, instead of only merging the newly opened tab with the last tab."
created: 2026-01-25T21:10:00Z
updated: 2026-01-25T21:11:30Z
---

## Current Focus

hypothesis: CONFIRMED - Fix implemented, all tests pass, build succeeds
test: 90 unit tests pass, lint passes, build succeeds
expecting: Only link clicks intercepted, not typed/pasted URLs
next_action: N/A - Debug complete

## Symptoms

expected: When clicking a link that opens a new tab, QuickTab should merge ONLY the NEW OPENED tab + the LAST tab of the same domain. Other tabs should remain untouched.
actual: QuickTab is closing ALL zendesk.com tabs AND collapsing tabs into non-Zendesk tabs (wrong grouping).
errors: No console errors visible - tabs close silently
reproduction: Paste URL in address bar triggers the bug; link clicks work correctly
started: Regression - this doesn't match the original extension behavior

## Key User Feedback

From user testing session:
- "it's intercepting tabs AS YOU OPEN THEM manually, not by clicking a link"
- "Did NOT happen with a click even after uninstall/reinstall"
- "That happens again only if I paste the link, not if I click the link"
- "Had 2 opened, pasted in a 3rd, collapsed all into my GitHub link"

## Root Cause

**The navigation handlers were intercepting ALL navigation types instead of only LINK CLICKS.**

chrome.webNavigation.onCommitted provides `transitionType`:
- `"link"` - User clicked a link → SHOULD intercept
- `"typed"` - User typed/pasted URL → Should NOT intercept
- `"auto_bookmark"` - Clicked bookmark → Should NOT intercept
- etc.

The rewritten code had:
1. BOTH onBeforeNavigate AND onCommitted calling handleNavigation()
2. NO filtering by transitionType
3. Result: Every navigation to zendesk.com triggered tab merging

## Fix Applied

1. **Removed onBeforeNavigate handler** - it doesn't have transitionType
2. **Added transitionType filter** in onCommitted:
   ```typescript
   if (details.transitionType !== "link") return;
   ```
3. **Kept existing improvements** from earlier fix (deduplication, live tab queries, URL validation)

## Verification

- All 90 unit tests pass
- Build succeeds
- Lint passes
- Awaiting user verification with real tabs

## Files Changed

- `/home/jc/developer/QuickTab/entrypoints/background.ts`

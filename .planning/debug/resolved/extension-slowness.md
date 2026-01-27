---
status: resolved
trigger: "Extension has become extremely slow after a recent code commit"
created: 2026-01-27T00:00:00Z
updated: 2026-01-27T00:00:00Z
---

## Current Focus

hypothesis: setActionIcon() uses sequential await in a loop (for...of + await), blocking execution while updating icons for each tab one at a time. This is called on EVERY DOMContentLoaded and mode change.
test: Look at setActionIcon implementation and where it's called
expecting: Sequential await pattern (for...of with await inside) causing slow execution
next_action: Verify sequential await pattern and check call frequency

## Symptoms

expected: Fast/instant response - actions should complete quickly
actual: All extension actions are extremely slow
errors: No errors visible
reproduction: All extension actions are slow
started: Was working well before, became slow after a recent code commit

## Eliminated

## Evidence

- timestamp: 2026-01-27T00:01:00Z
  checked: Recent git commits
  found: Commit 0c04754 introduced postMessage routing via chrome.scripting.executeScript
  implication: This is a key change that could affect performance

- timestamp: 2026-01-27T00:02:00Z
  checked: setActionIcon function at lines 90-105 in background.ts
  found: Uses sequential await in for loop - for each tab, awaits chrome.action.setIcon()
  implication: If N tabs open, this blocks for N serial API calls instead of N parallel calls

- timestamp: 2026-01-27T00:02:30Z
  checked: Where setActionIcon is called
  found: Called in onDOMContentLoaded (line 392) and setMode handler (line 424)
  implication: Every Zendesk page load triggers this slow sequential operation

## Resolution

root_cause: setActionIcon() at lines 96-104 uses sequential await in a for loop. Each chrome.action.setIcon() call must complete before the next one starts. With N Zendesk tabs open, this takes N * (single setIcon time) instead of max(single setIcon time). This function is called on every DOMContentLoaded for Zendesk pages AND on every mode change from the popup.
fix: Changed setActionIcon() to use Promise.all() with map() for parallel execution of all chrome.action.setIcon() calls. Used type guard filter to avoid non-null assertions.
verification: Build succeeded (wxt build), all 95 tests pass (npm test), linter passes (npm run lint)
files_changed:
  - entrypoints/background.ts (lines 90-105)

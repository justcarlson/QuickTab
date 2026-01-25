---
phase: 01-build-foundation
plan: 03
subsystem: infra
tags: [wxt, icons, i18n, bundle-analysis, rollup-plugin-visualizer]

# Dependency graph
requires:
  - phase: 01-01
    provides: WXT build infrastructure and entrypoints
provides:
  - Extension icons in WXT public directory
  - i18n messages with appName and appDescription
  - Bundle visualizer for size analysis
affects: [02-core-migration, 03-ui-migration]

# Tech tracking
tech-stack:
  added: [rollup-plugin-visualizer@6.0.5]
  patterns: [WXT public/ for static assets, conditional Vite plugins via env]

key-files:
  created:
    - public/images/icons/icon-16.png
    - public/images/icons/icon-48.png
    - public/images/icons/icon-128.png
    - public/_locales/en/messages.json
  modified:
    - wxt.config.ts
    - package.json
    - package-lock.json

key-decisions:
  - "Use __MSG_appName__ for i18n-aware manifest name"
  - "Conditional visualizer plugin via ANALYZE env variable"

patterns-established:
  - "Static assets in public/ directory following WXT conventions"
  - "Bundle analysis via npm run analyze for size monitoring"

# Metrics
duration: 2 min
completed: 2026-01-25
---

# Phase 1 Plan 3: Move Static Assets and Add Bundle Analysis Summary

**Extension icons and i18n messages in WXT public/ directory with rollup-plugin-visualizer for bundle size monitoring**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-25T17:10:01Z
- **Completed:** 2026-01-25T17:11:48Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Migrated extension icons (16px, 48px, 128px) from legacy app/ to WXT public/images/icons/
- Migrated i18n messages to public/_locales/en/ with appName and appDescription keys
- Integrated rollup-plugin-visualizer for on-demand bundle size analysis
- Added npm run analyze script for treemap visualization with gzip/brotli sizes

## Task Commits

Each task was committed atomically:

1. **Task 1: Move static assets to public directory** - `e243bd9` (chore)
2. **Task 2: Add bundle visualizer for size analysis** - `dd3ce75` (feat)

## Files Created/Modified
- `public/images/icons/icon-16.png` - 16px extension icon
- `public/images/icons/icon-48.png` - 48px extension icon
- `public/images/icons/icon-128.png` - 128px extension icon
- `public/_locales/en/messages.json` - i18n messages with appName, appDescription
- `wxt.config.ts` - Added icons, default_locale, and visualizer plugin
- `package.json` - Added analyze script
- `package-lock.json` - Added rollup-plugin-visualizer dependency

## Decisions Made
- **i18n manifest fields:** Used `__MSG_appName__` and `__MSG_appDescription__` placeholders in manifest for proper Chrome i18n support
- **Conditional visualizer:** Only load visualizer plugin when ANALYZE=true to avoid overhead in normal builds
- **Treemap template:** Selected treemap visualization for bundle stats (easier to scan than sunburst)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added appName and appDescription i18n keys**
- **Found during:** Task 1 (Copy i18n messages)
- **Issue:** Original messages.json from legacy app/ was missing required appName and appDescription keys for Chrome i18n manifest
- **Fix:** Added appName and appDescription entries to messages.json
- **Files modified:** public/_locales/en/messages.json
- **Verification:** Build succeeds with __MSG_appName__ in manifest
- **Committed in:** e243bd9 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Required for Chrome to resolve manifest i18n placeholders. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Static assets properly located in WXT public/ directory
- Bundle analysis available via `npm run analyze`
- Build output includes icons and i18n at correct paths
- Ready for 01-04: Clean up legacy files

---
*Phase: 01-build-foundation*
*Completed: 2026-01-25*

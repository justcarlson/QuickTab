---
phase: 05-webstore-compliance
plan: 01
subsystem: infra
tags: [privacy, manifest, chrome-web-store, compliance]

# Dependency graph
requires:
  - phase: 04-testing-quality
    provides: fully tested extension build
provides:
  - PRIVACY.md privacy policy for Chrome Web Store submission
  - Cleaned manifest permissions (removed unused scripting)
  - Production build excludes source maps from ZIP
  - Versioned ZIP artifact naming
affects: [05-02, 05-03, chrome-web-store-submission]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Conditional sourcemap generation (hidden for production)
    - ZIP exclude patterns for build artifacts

key-files:
  created:
    - PRIVACY.md
  modified:
    - wxt.config.ts

key-decisions:
  - "Use zip.exclude for map files instead of excludeSources (excludeSources only applies to sources ZIP)"
  - "sourcemap: hidden generates maps for debugging but excludes sourceMappingURL from bundles"

patterns-established:
  - "Plain-language privacy policy: 'We don't collect your data. Period.'"
  - "Permissions table format for user-friendly documentation"

# Metrics
duration: 3min
completed: 2026-01-26
---

# Phase 5 Plan 1: Privacy Policy & Manifest Cleanup Summary

**Plain-language privacy policy with "no data collection" messaging, removed unused scripting permission, and production ZIP excludes source maps**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-26T00:30:38Z
- **Completed:** 2026-01-26T00:33:10Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created PRIVACY.md with 7 sections including permissions table
- Removed unused scripting permission from manifest (never called in modernized codebase)
- Configured production builds to exclude source maps from ZIP artifacts
- Added versioned ZIP naming: quicktab-v{{version}}-{{browser}}.zip

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PRIVACY.md** - `d93aec8` (docs)
2. **Task 2: Update wxt.config.ts for compliance** - `c0e5662` (chore)

## Files Created/Modified
- `PRIVACY.md` - Plain-language privacy policy with all permissions explained
- `wxt.config.ts` - Removed scripting permission, added sourcemap/zip config

## Decisions Made
- Used `zip.exclude` instead of `excludeSources` - the latter only applies to sources ZIP, not the extension ZIP
- `sourcemap: "hidden"` generates map files but excludes sourceMappingURL reference from bundles; combined with `zip.exclude` to fully exclude from distribution

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used zip.exclude instead of excludeSources**
- **Found during:** Task 2 (Update wxt.config.ts)
- **Issue:** Initial use of `excludeSources` did not exclude .map files from ZIP - WXT's `excludeSources` only applies to the sources ZIP when `zipSources: true`, not the main extension ZIP
- **Fix:** Changed to `zip.exclude: ["**/*.map"]` which is the correct option for extension ZIP
- **Files modified:** wxt.config.ts
- **Verification:** `unzip -l` shows 0 .map files in output ZIP
- **Committed in:** c0e5662 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Config option correction necessary for feature to work. No scope creep.

## Issues Encountered
None - after correcting the WXT config option, all verifications passed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Privacy policy ready for Chrome Web Store submission
- Manifest permissions cleaned up (3 permissions: webNavigation, tabs, storage)
- Production ZIP ready with versioned naming and no source maps
- Ready for store assets (screenshots, promotional images) in next plan

---
*Phase: 05-webstore-compliance*
*Completed: 2026-01-26*

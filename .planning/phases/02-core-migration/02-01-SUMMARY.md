---
phase: 02-core-migration
plan: 01
subsystem: utils
tags: [typescript, url-matching, types, chrome-extension]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: TypeScript configuration, Biome linting, WXT framework
provides:
  - Shared type definitions (RouteMatch, RouteType, UrlDetectionMode, ZendeskTabInfo, StorageSchema)
  - URL matching module with matchZendeskUrl, buildZendeskUrl, isZendeskAgentUrl
affects: [02-02-storage, 02-03-service-worker, 03-tab-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure functions for URL matching logic"
    - "Native URL constructor for parsing (not regex)"
    - "Type-safe interfaces for storage schema"

key-files:
  created:
    - src/utils/types.ts
    - src/utils/url-matching.ts
  modified: []

key-decisions:
  - "Use native URL constructor for parsing, regex for route matching only"
  - "Pathname-only matching ignores query params and hash fragments"
  - "Ticket routes take priority over lotus routes"
  - "Record<number, T> for tab tracking (JSON-serializable, not Map)"

patterns-established:
  - "Types in src/utils/types.ts for cross-module sharing"
  - "Pure utility functions in src/utils/*.ts"
  - "JSDoc comments on all exports"

# Metrics
duration: 2min
completed: 2026-01-25
---

# Phase 2 Plan 1: URL Types & Matching Summary

**TypeScript type definitions and URL matching module ported from legacy ES5, using native URL constructor and pattern-based route detection**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-25T18:41:20Z
- **Completed:** 2026-01-25T18:43:19Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- Created shared type definitions for URL matching and storage schema
- Ported legacy url_match.js to TypeScript with native URL parsing
- URL matching correctly handles restricted routes (chat, voice, print)
- All types properly exported for use by service worker and storage modules

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared type definitions** - `754d884` (feat)
2. **Task 2: Port URL matching logic to TypeScript** - `9288445` (feat)

## Files Created/Modified
- `src/utils/types.ts` - Shared type definitions (RouteMatch, RouteType, UrlDetectionMode, ZendeskTabInfo, StorageSchema)
- `src/utils/url-matching.ts` - Pure URL matching functions (matchZendeskUrl, buildZendeskUrl, isZendeskAgentUrl)

## Decisions Made
- **Native URL constructor over regex for URL parsing:** Better edge case handling, proper encoding, built-in port handling
- **Pathname-only matching:** Per CONTEXT.md, ignoring query params and hash fragments
- **ZENDESK_DOMAIN_SUFFIX constant:** Centralized domain suffix for consistency
- **Type assertions for route type:** `as RouteType` used since string literals don't auto-narrow

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Type definitions ready for import by storage.ts (02-02)
- URL matching ready for import by service worker (02-03)
- Both files compile cleanly with TypeScript
- Both files pass Biome linting

---
*Phase: 02-core-migration*
*Completed: 2026-01-25*

# Roadmap: QuickTab Modernization

## Overview

This roadmap transforms QuickTab from a legacy Chrome extension (jQuery 1.6.1, ES5, Grunt) into a modern, maintainable codebase (TypeScript, Vite/WXT, Vitest/Playwright) while preserving its core behavior: routing Zendesk navigation to existing agent tabs. The migration progresses from build infrastructure through core logic, UI, testing, compliance, and finally CI/CD automation.

**Git Workflow:** Each phase is developed on a dedicated feature branch (e.g., `feat/phase-1-build-foundation`). Work is merged to main via PR at phase completion, and a tag marks the release point (e.g., `v0.12.0-phase-1`). Main branch always remains deployable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Build Foundation** - WXT/Vite project structure with TypeScript and tooling
- [ ] **Phase 2: Core Migration** - Service worker and URL matching logic to TypeScript
- [ ] **Phase 3: UI Migration** - Popup and welcome page to vanilla TypeScript
- [ ] **Phase 4: Testing & Quality** - Unit tests, E2E tests, and coverage
- [ ] **Phase 5: Web Store Compliance** - Privacy policy, permissions audit, store metadata
- [ ] **Phase 6: CI/CD & Automation** - GitHub Actions, versioning, changelog

## Phase Details

### Phase 1: Build Foundation
**Goal**: Establish modern build infrastructure with WXT, TypeScript, and Biome before any code migration
**Depends on**: Nothing (first phase)
**Branch**: `feat/phase-1-build-foundation`
**Requirements**: BUILD-01, BUILD-02, BUILD-03, BUILD-04, BUILD-05, BUILD-06, QUAL-01, QUAL-02, QUAL-03
**Success Criteria** (what must be TRUE):
  1. `npm run dev` starts WXT dev server with HMR working
  2. `npm run build` produces loadable Chrome extension in dist/
  3. TypeScript compilation runs with strict mode and ES2022 target
  4. Biome linting and formatting integrated with pre-commit hooks
  5. Source maps enable debugging in Chrome DevTools
  6. Feature branch merged to main via PR
  7. Phase completion tagged as `v0.12.0-phase-1`
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md - Initialize WXT project and TypeScript configuration
- [ ] 01-02-PLAN.md - Configure Biome and pre-commit hooks
- [ ] 01-03-PLAN.md - Move static assets and add bundle analysis
- [ ] 01-04-PLAN.md - Verify build infrastructure (checkpoint)

### Phase 2: Core Migration
**Goal**: Migrate service worker and URL matching logic to TypeScript with storage-first architecture
**Depends on**: Phase 1
**Branch**: `feat/phase-2-core-migration`
**Requirements**: MIGR-03, MIGR-04, MIGR-05, MIGR-06, MIGR-07, STORE-03
**Success Criteria** (what must be TRUE):
  1. Extension intercepts Zendesk navigation and routes to existing tabs (core behavior works)
  2. Service worker survives termination - state persists via chrome.storage
  3. All event listeners register synchronously at module scope
  4. URL matching correctly identifies Lotus routes, ticket routes, and restricted routes
  5. No runtime dependencies loaded from external URLs (all bundled)
  6. Feature branch merged to main via PR
  7. Phase completion tagged as `v0.12.0-phase-2`
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: UI Migration
**Goal**: Migrate popup and welcome page from jQuery/Handlebars to vanilla TypeScript
**Depends on**: Phase 2
**Branch**: `feat/phase-3-ui-migration`
**Requirements**: MIGR-01, MIGR-02, MIGR-08, MIGR-09, MIGR-10
**Success Criteria** (what must be TRUE):
  1. Popup displays current detection mode and allows toggling between modes
  2. Settings changes persist across browser sessions
  3. Welcome page displays correctly on first install
  4. i18n strings load and display in English locale
  5. Zero jQuery or Handlebars dependencies remain in codebase
  6. Feature branch merged to main via PR
  7. Phase completion tagged as `v0.12.0-phase-3`
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Testing & Quality
**Goal**: Establish comprehensive test coverage for regression prevention
**Depends on**: Phase 3
**Branch**: `feat/phase-4-testing-quality`
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, TEST-08, QUAL-04
**Success Criteria** (what must be TRUE):
  1. `npm test` runs Vitest unit tests with Chrome API mocking
  2. URL matching logic has test coverage for all pattern types
  3. Storage operations have test coverage for read/write/persistence
  4. E2E tests verify navigation interception in real browser
  5. Service worker termination tests validate state persistence
  6. Feature branch merged to main via PR
  7. Phase completion tagged as `v0.12.0-phase-4`
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Web Store Compliance
**Goal**: Prepare extension for Chrome Web Store submission
**Depends on**: Phase 4
**Branch**: `feat/phase-5-webstore-compliance`
**Requirements**: STORE-01, STORE-02, STORE-04, STORE-05
**Success Criteria** (what must be TRUE):
  1. Privacy policy document exists and explains data handling
  2. manifest.json contains only permissions actively used in code
  3. Code is minified but readable (not obfuscated)
  4. Store listing has updated description and screenshots
  5. Feature branch merged to main via PR
  6. Phase completion tagged as `v0.12.0-phase-5`
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: CI/CD & Automation
**Goal**: Automate testing, building, and release workflows
**Depends on**: Phase 5
**Branch**: `feat/phase-6-cicd-automation`
**Requirements**: CICD-01, CICD-02, CICD-03, CICD-04, CICD-05
**Success Criteria** (what must be TRUE):
  1. Pull requests trigger automated lint, test, and build checks
  2. Push to main triggers CI workflow
  3. Git tags trigger release workflow producing ZIP artifact
  4. Changelog generates from conventional commit history
  5. Version bumping automated during release
  6. Feature branch merged to main via PR
  7. Phase completion tagged as `v0.12.0` (final release)
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

Each phase completes with a PR merge to main and a release tag.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Build Foundation | 1/4 | In progress | - |
| 2. Core Migration | 0/? | Not started | - |
| 3. UI Migration | 0/? | Not started | - |
| 4. Testing & Quality | 0/? | Not started | - |
| 5. Web Store Compliance | 0/? | Not started | - |
| 6. CI/CD & Automation | 0/? | Not started | - |

---
*Roadmap created: 2026-01-25*
*Depth: comprehensive*
*Coverage: 38/38 deliverable requirements mapped*

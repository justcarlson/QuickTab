# Requirements: QuickTab Modernization

**Defined:** 2026-01-25
**Core Value:** Zendesk links open in existing agent tabs, not new ones. This single behavior must work reliably.

## v1 Requirements

Requirements for modernization release. Each maps to roadmap phases.

### Build System

- [ ] **BUILD-01**: Project uses WXT framework with Vite for extension bundling
- [ ] **BUILD-02**: TypeScript 5.9+ with ES2022 target and strict mode enabled
- [ ] **BUILD-03**: Source maps generated for development debugging
- [ ] **BUILD-04**: npm scripts for dev, build, test, and lint workflows
- [ ] **BUILD-05**: Hot module replacement (HMR) works during development
- [ ] **BUILD-06**: Bundle size analysis available via build script

### Code Quality

- [ ] **QUAL-01**: Biome configured for linting and formatting
- [ ] **QUAL-02**: Pre-commit hooks enforce lint and format via Husky + lint-staged
- [ ] **QUAL-03**: @types/chrome provides TypeScript definitions for Chrome APIs
- [ ] **QUAL-04**: CI runs Biome checks on pull requests

### Testing

- [ ] **TEST-01**: Vitest configured for unit testing
- [ ] **TEST-02**: Chrome API mocking via @webext-core/fake-browser
- [ ] **TEST-03**: Unit tests cover URL matching logic
- [ ] **TEST-04**: Unit tests cover storage operations
- [ ] **TEST-05**: Unit tests cover service worker event handlers
- [ ] **TEST-06**: E2E tests with Playwright for navigation flows
- [ ] **TEST-07**: Coverage reporting integrated with test runs
- [ ] **TEST-08**: Service worker termination tests validate state persistence

### CI/CD

- [ ] **CICD-01**: GitHub Actions workflow runs lint, test, build on PR
- [ ] **CICD-02**: GitHub Actions workflow runs on push to main
- [ ] **CICD-03**: Automated version bumping on release
- [ ] **CICD-04**: Changelog generated from conventional commits
- [ ] **CICD-05**: Release workflow creates ZIP artifact on tag

### Web Store Compliance

- [ ] **STORE-01**: Privacy policy document created and linked
- [ ] **STORE-02**: Permission audit completed — unused permissions removed
- [ ] **STORE-03**: All dependencies bundled — no remote code execution
- [ ] **STORE-04**: Code is minified but not obfuscated
- [ ] **STORE-05**: Store metadata updated (description, screenshots)

### Git Workflow

- [ ] **GIT-01**: Each phase developed on dedicated feature branch
- [ ] **GIT-02**: Git worktrees used for parallel development and safe rollback
- [ ] **GIT-03**: Atomic commits per logical change with conventional commit messages
- [ ] **GIT-04**: PRs required for merging to main — no direct commits
- [ ] **GIT-05**: Main branch always deployable — broken code never merged
- [ ] **GIT-06**: Tags mark each phase completion for easy revert points

### Code Migration

- [ ] **MIGR-01**: jQuery 1.6.1 removed — all DOM manipulation uses vanilla TypeScript
- [ ] **MIGR-02**: Handlebars removed — popup uses plain HTML with TypeScript
- [ ] **MIGR-03**: ES5 code converted to ES2022+ TypeScript
- [ ] **MIGR-04**: Service worker uses storage-first architecture (no global state)
- [ ] **MIGR-05**: Event listeners registered synchronously at module scope
- [ ] **MIGR-06**: Type-safe Chrome API wrappers for storage, tabs, webNavigation
- [ ] **MIGR-07**: URL matching logic ported to typed TypeScript module
- [ ] **MIGR-08**: Popup UI ported to vanilla TypeScript
- [ ] **MIGR-09**: Welcome page ported to vanilla TypeScript
- [ ] **MIGR-10**: i18n system preserved and working

## v2 Requirements

Deferred to future release. Not in current roadmap.

### Enhanced Testing

- **TEST-V2-01**: Visual regression testing for popup UI
- **TEST-V2-02**: Performance benchmarking for URL matching

### Automation

- **AUTO-V2-01**: Automated Chrome Web Store publishing via CI
- **AUTO-V2-02**: Automated screenshot generation for store listing

### Features

- **FEAT-V2-01**: Additional locale support beyond English
- **FEAT-V2-02**: User-configurable URL patterns (advanced mode)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| React/Vue for popup | Overkill for simple settings UI — adds bundle size and complexity |
| Analytics/telemetry | Requires privacy policy disclosure and user consent — complexity not worth it |
| Monorepo structure | Single extension doesn't benefit from monorepo overhead |
| Firefox/Safari support | Chrome-only focus for v1 — cross-browser adds significant testing burden |
| Remote configuration | MV3 compliance risk — all code must be bundled |
| New end-user features | This is a technical modernization — feature work is post-v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUILD-01 | Phase 1 | Complete |
| BUILD-02 | Phase 1 | Complete |
| BUILD-03 | Phase 1 | Complete |
| BUILD-04 | Phase 1 | Complete |
| BUILD-05 | Phase 1 | Complete |
| BUILD-06 | Phase 1 | Complete |
| QUAL-01 | Phase 1 | Complete |
| QUAL-02 | Phase 1 | Complete |
| QUAL-03 | Phase 1 | Complete |
| QUAL-04 | Phase 4 | Pending |
| TEST-01 | Phase 4 | Pending |
| TEST-02 | Phase 4 | Pending |
| TEST-03 | Phase 4 | Pending |
| TEST-04 | Phase 4 | Pending |
| TEST-05 | Phase 4 | Pending |
| TEST-06 | Phase 4 | Pending |
| TEST-07 | Phase 4 | Pending |
| TEST-08 | Phase 4 | Pending |
| CICD-01 | Phase 6 | Pending |
| CICD-02 | Phase 6 | Pending |
| CICD-03 | Phase 6 | Pending |
| CICD-04 | Phase 6 | Pending |
| CICD-05 | Phase 6 | Pending |
| STORE-01 | Phase 5 | Pending |
| STORE-02 | Phase 5 | Pending |
| STORE-03 | Phase 2 | Pending |
| STORE-04 | Phase 5 | Pending |
| STORE-05 | Phase 5 | Pending |
| MIGR-01 | Phase 3 | Pending |
| MIGR-02 | Phase 3 | Pending |
| MIGR-03 | Phase 2 | Pending |
| MIGR-04 | Phase 2 | Pending |
| MIGR-05 | Phase 2 | Pending |
| MIGR-06 | Phase 2 | Pending |
| MIGR-07 | Phase 2 | Pending |
| MIGR-08 | Phase 3 | Pending |
| MIGR-09 | Phase 3 | Pending |
| MIGR-10 | Phase 3 | Pending |
| GIT-01 | All Phases | Pending |
| GIT-02 | All Phases | Pending |
| GIT-03 | All Phases | Pending |
| GIT-04 | All Phases | Pending |
| GIT-05 | All Phases | Pending |
| GIT-06 | All Phases | Pending |

**Coverage:**
- v1 requirements: 44 total (38 deliverable + 6 workflow constraints)
- Mapped to phases: 44
- Unmapped: 0

---
*Requirements defined: 2026-01-25*
*Last updated: 2026-01-25 after roadmap creation*

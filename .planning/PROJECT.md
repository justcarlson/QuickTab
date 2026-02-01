# QuickTab

## What This Is

A Chrome extension for Zendesk users that intercepts zendesk.com navigation and routes it to existing agent tabs instead of opening new ones. Published on Chrome Web Store, modernized from legacy jQuery/Grunt to TypeScript/WXT with comprehensive testing and CI/CD automation.

## Core Value

Zendesk links open in existing agent tabs, not new ones. This single behavior must work reliably across all supported URL patterns.

## Requirements

### Validated

- **v1.0** — Intercept zendesk.com/agent navigation events
- **v1.0** — Route intercepted URLs to existing Zendesk agent tabs
- **v1.0** — URL pattern matching (Lotus routes, ticket routes, restricted routes)
- **v1.0** — User-configurable detection modes (all URLs, ticket URLs, disabled)
- **v1.0** — Popup UI for settings and status display
- **v1.0** — Welcome page on first install
- **v1.0** — Icon state reflects current detection mode
- **v1.0** — Settings persist via Chrome storage
- **v1.0** — i18n support with localized strings
- **v1.0** — WXT + TypeScript + Vite build system
- **v1.0** — Biome linting with pre-commit hooks
- **v1.0** — Vitest unit tests (100+ tests, 98% coverage)
- **v1.0** — Playwright E2E tests for popup
- **v1.0** — GitHub Actions CI pipeline
- **v1.0** — Release-please versioning and changelog
- **v1.0** — Chrome Web Store compliance package
- ✓ **v1.0.1** — Version sync between package.json and GitHub releases
- ✓ **v1.0.1** — Release-please configured with last-release-sha for changelog scoping
- ✓ **v1.0.1** — Extension submitted and approved on Chrome Web Store
- ✓ **v1.0.1** — Extension publicly available (ID: nmdffjdpeginhmabpeikjimggmnoojjp)

### Active

(None — waiting for user feedback and next milestone planning)

### Out of Scope

- New features beyond bug fixes — v1 was technical modernization
- Rebrand or visual refresh — keeping QuickTab identity
- Automated Chrome Web Store publishing — manual upload for now
- Support for non-Chrome browsers — Chrome/Chromium only
- Analytics/telemetry — privacy-focused extension
- React/Vue for popup — vanilla TypeScript sufficient

## Context

**Current State (v1.0.1 shipped):**
- Published on Chrome Web Store (ID: nmdffjdpeginhmabpeikjimggmnoojjp)
- WXT + TypeScript + Vite build system
- Biome linting with pre-commit hooks
- Storage-first service worker architecture (MV3 compliant)
- Vanilla TypeScript popup and welcome page
- 100+ unit tests (98% coverage), Playwright E2E
- GitHub Actions CI with lint, test, build, E2E
- Release-please for versioning and changelog

**Tech Stack:**
- WXT 0.19.x (extension framework)
- TypeScript 5.9+ (ES2022 target)
- Vite (bundler)
- Biome 2.3.x (linter/formatter)
- Vitest 3.2.x (unit testing)
- Playwright (E2E testing)
- GitHub Actions (CI/CD)
- Release-please (versioning)

**Code Size:** 2,509 lines TypeScript

**Known Tech Debt:**
- Type safety issue in background.ts line 124 (build succeeds but tsc --noEmit fails)
- Navigation interception needs human verification with Zendesk access
- Orphaned exports in url-matching.ts and tabs.ts (test-only)
- E2E tests cover popup only (navigation via unit tests)
- last-release-sha in release-please-config.json should be removed after next release PR merges

## Constraints

- **Manifest Version**: Must be Manifest V3 compliant
- **Browser Support**: Chrome/Chromium only
- **Scope**: Bug fixes and maintenance for v1.x
- **Dependencies**: Minimal runtime dependencies
- **Testing**: CI gates before merging

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Remove jQuery entirely | Security vulnerabilities, unnecessary weight | Good |
| Remove Handlebars | Simple UI doesn't justify templating runtime | Good |
| TypeScript over JavaScript | Type safety, maintainability | Good |
| WXT over alternatives | Active maintenance, excellent Vite integration | Good |
| Biome over ESLint+Prettier | 10-25x faster, single config | Good |
| Storage-first architecture | MV3 state loss mitigation | Good |
| Vitest + Playwright | Fast unit tests, real browser E2E | Good |
| GitHub Actions | Free for public repos, good ecosystem | Good |
| Release-please | Automated versioning, changelog from commits | Good |
| Manual Web Store publishing | Focus on code quality first | ✓ Good |
| Raw GitHub URL for privacy policy | Stable, no hosting cost | ✓ Good |
| Workflow & Planning category | Best fit for agent workflow tool | ✓ Good |

---
*Last updated: 2026-01-31 after v1.0.1 milestone*

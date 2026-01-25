# QuickTab

## What This Is

A Chrome extension for Zendesk users that intercepts zendesk.com navigation and routes it to existing agent tabs instead of opening new ones. Originally abandoned by maintainers and removed from Chrome Web Store — now being modernized for security, maintainability, and republishing.

## Core Value

Zendesk links open in existing agent tabs, not new ones. This single behavior must work reliably across all supported URL patterns.

## Requirements

### Validated

- ✓ Intercept zendesk.com/agent navigation events — existing
- ✓ Route intercepted URLs to existing Zendesk agent tabs — existing
- ✓ URL pattern matching (Lotus routes, ticket routes, restricted routes) — existing
- ✓ User-configurable detection modes (all URLs, ticket URLs, disabled) — existing
- ✓ Popup UI for settings and status display — existing
- ✓ Welcome page on first install — existing
- ✓ Icon state reflects current detection mode — existing
- ✓ Settings persist via Chrome storage — existing
- ✓ i18n support with localized strings — existing

### Active

- [ ] Migrate from jQuery 1.6.1 to vanilla JavaScript
- [ ] Replace Handlebars templates with plain HTML + JS
- [ ] Convert ES5 codebase to TypeScript
- [ ] Replace Grunt + Webpack 1.x with Vite
- [ ] Add unit test coverage with Vitest
- [ ] Add E2E browser tests with Playwright
- [ ] Set up GitHub Actions CI pipeline (lint, test, build, security scan)
- [ ] Ensure full Chrome Web Store policy compliance
- [ ] Create release workflow with versioning and artifacts
- [ ] Document codebase for maintainer handoff

### Out of Scope

- New features beyond bug fixes — this is a technical modernization
- Rebrand or visual refresh — keeping QuickTab identity
- Automated Chrome Web Store publishing — manual upload for now
- Support for non-Chrome browsers — Chrome/Chromium only

## Context

**Origin:** Forked from abandoned extension removed from Chrome Web Store. Original functionality intact but built on outdated dependencies with known vulnerabilities.

**Current State:**
- jQuery 1.6.1 (2011, multiple CVEs)
- Handlebars 2.0.0
- ES5 JavaScript throughout
- Grunt 1.6.1 + Webpack 1.x build system
- No tests, no CI/CD, no security scanning
- Already partially migrated to Manifest V3

**Target State:**
- Zero jQuery — vanilla TypeScript
- No templating runtime — plain HTML
- Modern ES2022+ TypeScript
- Vite build system
- Vitest + Playwright test coverage
- GitHub Actions CI with security scanning
- Chrome Web Store compliant and published

**Publishing:** Chrome developer account ready. Manual upload workflow until automation needs justify investment.

## Constraints

- **Manifest Version**: Must be Manifest V3 compliant — V2 deprecated
- **Browser Support**: Chrome/Chromium only — no Firefox/Safari/Edge
- **Scope**: Technical modernization — no new end-user features
- **Dependencies**: Minimize runtime dependencies — prefer vanilla implementations
- **Testing**: Must have CI gates before merging — no untested code to main

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Remove jQuery entirely | Minimal DOM manipulation, security vulnerabilities, unnecessary weight | — Pending |
| Remove Handlebars | Simple UI doesn't justify templating runtime, reduces dependencies | — Pending |
| TypeScript over JavaScript | Type safety, better maintainability, IDE support, catches bugs early | — Pending |
| Vite over alternatives | Fast, modern, excellent Chrome extension ecosystem support | — Pending |
| Vitest + Playwright | Modern test stack, fast unit tests, real browser E2E | — Pending |
| GitHub Actions | Free for public repos, good ecosystem, team familiarity | — Pending |
| Manual Web Store publishing | Focus on codebase quality first, automation later if needed | — Pending |

---
*Last updated: 2026-01-25 after initialization*

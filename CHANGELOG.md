### v0.12.0 (2026-01-26)

Complete codebase modernization.

**Build System**
* Migrate from Grunt to WXT + Vite
* Add TypeScript 5.9 with strict mode
* Add Biome for linting and formatting
* Add pre-commit hooks via Husky + lint-staged

**Core**
* Rewrite service worker in TypeScript with storage-first architecture
* Create typed URL matching module for Zendesk route detection
* All event listeners register synchronously for MV3 compliance
* Remove jQuery 1.6.1 and legacy ES5 code

**UI**
* Migrate popup to vanilla TypeScript
* Migrate welcome page to vanilla TypeScript
* Add CSS custom properties with automatic dark mode
* Three-way mode toggle: all URLs, tickets only, or disabled

**Testing**
* Add Vitest unit tests with 98% coverage on business logic
* Add Playwright E2E tests for popup UI
* Add GitHub Actions CI workflow for automated quality gates

**Compliance**
* Add PRIVACY.md with plain-language privacy policy
* Remove unused `scripting` permission from manifest
* Configure production builds to exclude source maps from ZIP

### v0.11.8 (2026-01-24)
* Refresh README, popup, welcome page, and icon set.
* Update help links to the GitHub README.

### v0.11.6 (2019-09-24)
* Uploaded to Zendesk Labs/QuickTab Github repository.

### v0.11.6 (2016-11-16)
* Latest release created.

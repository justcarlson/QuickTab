### v0.12.0-phase-5 (2026-01-26)
* Add PRIVACY.md with plain-language privacy policy for Chrome Web Store
* Expand README permissions section with detailed explanations
* Remove unused `scripting` permission from manifest
* Configure production builds to exclude source maps from ZIP
* Update release workflow to use WXT instead of Grunt

### v0.12.0-phase-4 (2026-01-25)
* Add Vitest unit tests with 98% coverage on business logic
* Add Playwright E2E tests for popup UI
* Add GitHub Actions CI workflow for automated quality gates
* Service worker termination tests validate MV3 state persistence

### v0.12.0-phase-3 (2026-01-25)
* Migrate popup UI to vanilla TypeScript (remove jQuery)
* Migrate welcome page to vanilla TypeScript (remove Handlebars)
* Add CSS custom properties with automatic dark mode support
* Three-way mode toggle: all URLs, tickets only, or disabled

### v0.12.0-phase-2 (2026-01-25)
* Migrate service worker to TypeScript with storage-first architecture
* Create typed URL matching module for Zendesk route detection
* Create Chrome API wrappers for storage and tabs
* All event listeners register synchronously for MV3 compliance

### v0.12.0-phase-1 (2026-01-25)
* Migrate build system from Grunt to WXT/Vite
* Add TypeScript 5.9 with strict mode
* Add Biome for linting and formatting
* Add pre-commit hooks via Husky + lint-staged
* Remove jQuery 1.6.1 and legacy dependencies

### v0.11.8 (2026-01-24)
* Refresh README, popup, welcome page, and icon set.
* Update help links to the GitHub README.

### v0.11.6 (2019-09-24)
* Uploaded to Zendesk Labs/QuickTab Github repository.

### v0.11.6 (2016-11-16)
* Latest release created.

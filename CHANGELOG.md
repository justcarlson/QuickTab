### v0.12.2 (2026-01-27)

Fix performance degradation when DLP/security extensions (like Incydr) are active.

**Fixed**
* Reduce chrome API calls from O(N) to O(1) per tab navigation
* Parallelize icon updates when changing modes
* Add `setTabIcon()` for single-tab updates instead of updating all tabs

**Technical Details**
* DLP extensions add latency to each `chrome.*` API call
* Previously, every navigation triggered N+1 API calls (query + N icon updates)
* Now only the specific navigated tab is updated

### v0.12.1 (2026-01-27)

Fix navigation handler regression to match legacy QuickTab behavior.

**Fixed**
* Use postMessage routing instead of chrome.tabs.update() to prevent cascade
* Multiple Zendesk tabs no longer close unexpectedly when routing
* Add `scripting` permission for chrome.scripting.executeScript()

**How it works**
* Legacy QuickTab used Zendesk's SPA internal routing via postMessage
* This navigates without triggering browser events, preventing cascades
* Now matches original extension behavior exactly

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

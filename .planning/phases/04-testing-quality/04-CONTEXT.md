# Phase 4: Testing & Quality - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish comprehensive test coverage for regression prevention. Unit tests with Vitest and Chrome API mocking. E2E tests with Playwright for navigation interception and UI verification. Coverage reporting with tiered thresholds.

</domain>

<decisions>
## Implementation Decisions

### Chrome API Mocking
- Use a mock library (e.g., webextension-polyfill-mock or similar)
- Mocks should be stateful — persist values between calls like real storage
- Shared setup file (vitest.setup.ts) configures all mocks globally
- Tests can override global mocks for specific edge case scenarios

### E2E Test Approach
- Use Playwright for browser extension E2E testing
- Headless mode by default, --headed flag available for debugging
- Mock pages simulate Zendesk URLs/routes (no real Zendesk access required)
- E2E tests verify popup and welcome page UI in addition to core behavior

### Coverage Targets
- Global minimum: 70% (CI failure gate)
- Business logic (src/utils/* + entrypoints/background.ts): 90% threshold
- UI components: lighter coverage (40-50%), E2E handles the heavy lifting
- Coverage reports generated both locally (npm test --coverage) and in CI
- Report formats: HTML + text + lcov (all three for maximum flexibility)

### Test Organization
- Unit tests co-located with source: storage.test.ts next to storage.ts
- Test file naming: *.test.ts convention
- E2E tests in top-level e2e/ directory
- Shared test utilities in test-utils/ folder (helpers, fixtures, factories)

### Claude's Discretion
- Specific mock library selection
- Vitest configuration details
- Playwright configuration for extension testing
- Mock page HTML structure
- Test utility implementation

</decisions>

<specifics>
## Specific Ideas

- Business-critical modules requiring 90% coverage: url-matching.ts, storage.ts, tabs.ts, types.ts, and background.ts service worker
- Mock pages should simulate Zendesk URL patterns that trigger navigation interception
- Coverage thresholds inspired by "business logic vs UI" separation — core migration logic is invisible and fatal if broken

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-testing-quality*
*Context gathered: 2026-01-25*

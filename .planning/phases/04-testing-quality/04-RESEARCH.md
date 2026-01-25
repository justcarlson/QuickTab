# Phase 4: Testing & Quality - Research

**Researched:** 2026-01-25
**Domain:** Browser Extension Testing (Vitest + Playwright)
**Confidence:** HIGH

## Summary

This phase establishes comprehensive test coverage for the QuickTab Chrome extension using Vitest for unit testing and Playwright for E2E testing. The WXT framework provides first-class Vitest integration through the `WxtVitest` plugin, which automatically configures Chrome API mocking via `@webext-core/fake-browser`.

The key challenge is testing Manifest V3 service worker behavior, where the service worker can terminate at any time, requiring storage-first architecture (which QuickTab already implements). Unit tests will focus on business logic modules (url-matching.ts, storage.ts, tabs.ts, background.ts) while E2E tests verify navigation interception in a real browser context.

**Primary recommendation:** Use WXT's built-in Vitest plugin with `@webext-core/fake-browser` for unit tests, and Playwright with persistent context for E2E tests. Coverage thresholds should be enforced in CI using the v8 provider.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | ^3.0.0 | Unit test runner | WXT's recommended test framework, native ESM support |
| @vitest/coverage-v8 | ^3.0.0 | Coverage collection | Faster than Istanbul, AST-based accuracy since v3.2.0 |
| wxt/testing/vitest-plugin | (bundled) | WXT integration | Auto-configures mocks, aliases, and env variables |
| @webext-core/fake-browser | ^1.3.2 | Chrome API mocking | Stateful in-memory implementation used by WxtVitest |
| @playwright/test | ^1.50.0 | E2E test runner | Only option for Chrome extension E2E testing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest-chrome | ^0.2.0 | Alternative Chrome mock | If fake-browser lacks specific API (webNavigation events) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @webext-core/fake-browser | vitest-chrome | More complete event mocking (callListeners), but less stateful storage |
| v8 coverage | istanbul | Battle-tested but 3x slower, no accuracy benefit since Vitest v3.2.0 |
| Playwright | Puppeteer | Puppeteer works but Playwright has better extension fixture support |

**Installation:**
```bash
npm install -D vitest @vitest/coverage-v8 @playwright/test
npx playwright install chromium
```

Note: `@webext-core/fake-browser` is bundled with WXT's testing plugin, no separate install needed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── utils/
│   ├── url-matching.ts
│   ├── url-matching.test.ts     # Co-located unit test
│   ├── storage.ts
│   ├── storage.test.ts
│   ├── tabs.ts
│   ├── tabs.test.ts
│   └── types.ts
entrypoints/
├── background.ts
├── background.test.ts           # Service worker unit tests
├── popup/
│   └── main.ts
└── welcome/
    └── main.ts
e2e/
├── fixtures.ts                  # Playwright extension fixtures
├── navigation.spec.ts           # Navigation interception E2E
├── popup.spec.ts               # Popup UI E2E
└── mock-pages/                 # Simulated Zendesk pages
    └── agent-ticket.html
test-utils/
├── factories.ts                # Test data factories
└── helpers.ts                  # Shared test utilities
```

### Pattern 1: WxtVitest Configuration
**What:** Configure Vitest with WXT's plugin for automatic Chrome API mocking
**When to use:** All unit tests in WXT projects
**Example:**
```typescript
// vitest.config.ts
// Source: https://wxt.dev/guide/essentials/unit-testing
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'entrypoints/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts', 'entrypoints/**/*.ts'],
      exclude: ['**/*.test.ts', '**/types.ts'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
        'src/utils/*.ts': {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
        'entrypoints/background.ts': {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
      },
    },
  },
});
```

### Pattern 2: Global Mock Setup with Reset
**What:** Reset fake-browser state between tests for isolation
**When to use:** Every test file using Chrome APIs
**Example:**
```typescript
// vitest.setup.ts
// Source: https://webext-core.aklinker1.io/fake-browser/reseting-state
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  // Reset all fake-browser state between tests
  fakeBrowser.reset();
  // Clear all Vitest mocks
  vi.clearAllMocks();
});
```

### Pattern 3: Playwright Extension Fixtures
**What:** Reusable fixtures for loading extension in persistent context
**When to use:** All E2E tests
**Example:**
```typescript
// e2e/fixtures.ts
// Source: https://playwright.dev/docs/chrome-extensions
import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'node:path';

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, '../.output/chrome-mv3');
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // Wait for service worker to be available (MV3)
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    const extensionId = serviceWorker.url().split('/')[2];
    await use(extensionId);
  },
});

export { expect } from '@playwright/test';
```

### Pattern 4: Testing Storage Operations
**What:** Test storage with stateful fake-browser
**When to use:** Testing storage.ts functions
**Example:**
```typescript
// src/utils/storage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { loadState, saveState, clearState } from './storage';

describe('storage', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('should return default state when storage is empty', async () => {
    const state = await loadState();
    expect(state).toEqual({ zendeskTabs: {} });
  });

  it('should persist and retrieve state', async () => {
    const testState = {
      zendeskTabs: { 1: { subdomain: 'test', lastActive: 123 } },
    };
    await saveState(testState);
    const loaded = await loadState();
    expect(loaded).toEqual(testState);
  });

  it('should clear state', async () => {
    await saveState({ zendeskTabs: { 1: { subdomain: 'test', lastActive: 123 } } });
    await clearState();
    const state = await loadState();
    expect(state).toEqual({ zendeskTabs: {} });
  });
});
```

### Pattern 5: Testing Event Listeners with vitest-chrome
**What:** Test Chrome event handler registration and triggering
**When to use:** Testing background.ts event handlers if fake-browser lacks event support
**Example:**
```typescript
// Alternative pattern if webNavigation events need manual triggering
import { chrome } from 'vitest-chrome';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('webNavigation events', () => {
  beforeEach(() => {
    chrome.webNavigation.onBeforeNavigate.clearListeners();
  });

  it('should register onBeforeNavigate listener', () => {
    const handler = vi.fn();
    chrome.webNavigation.onBeforeNavigate.addListener(handler);

    expect(chrome.webNavigation.onBeforeNavigate.hasListeners()).toBe(true);
  });

  it('should call handler with navigation details', () => {
    const handler = vi.fn();
    chrome.webNavigation.onBeforeNavigate.addListener(handler);

    chrome.webNavigation.onBeforeNavigate.callListeners({
      tabId: 123,
      url: 'https://company.zendesk.com/agent/tickets/456',
      frameId: 0,
      timeStamp: Date.now(),
      parentFrameId: -1,
      processId: -1,
      documentLifecycle: 'active',
      frameType: 'outermost_frame',
    });

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      tabId: 123,
      url: expect.stringContaining('zendesk.com'),
    }));
  });
});
```

### Anti-Patterns to Avoid
- **Global state in tests:** Never share state between tests; always reset in beforeEach
- **Testing implementation details:** Test observable behavior (storage changes, function returns), not internal logic
- **Hardcoded extension IDs:** Always derive extension ID from service worker URL at runtime
- **Skipping headless checks:** Verify tests pass in both headed and headless (chromium channel) modes
- **vi.mock inside beforeEach:** vi.mock is hoisted; place at module scope or use vi.doMock for dynamic mocking

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chrome storage mock | Manual mock object | @webext-core/fake-browser | Stateful, persists between calls, handles edge cases |
| Chrome event mock | Object with addListener stub | vitest-chrome events | Has callListeners() for triggering, clearListeners() for cleanup |
| Extension fixture | Manual launchPersistentContext | Playwright test.extend() | Proper cleanup, type safety, reusable |
| Coverage thresholds | Manual checks | Vitest coverage.thresholds | Built-in CI failure, per-file patterns |
| Test isolation | Manual cleanup | fakeBrowser.reset() | Complete state reset, no leaks |

**Key insight:** Chrome extension testing has unique requirements (service worker lifecycle, chrome.* API mocking, extension:// URLs) that general mocking libraries don't handle well. Use the specialized tools.

## Common Pitfalls

### Pitfall 1: Service Worker Termination Not Tested
**What goes wrong:** Tests pass but extension fails in production when service worker terminates
**Why it happens:** Test environment keeps service worker alive; global variables work during tests
**How to avoid:**
- Verify all state is persisted to chrome.storage.local
- Test by clearing in-memory state and reloading from storage
- E2E tests should verify behavior after page reload
**Warning signs:** Tests use global variables; no storage read after setup

### Pitfall 2: Event Listener Registration Timing
**What goes wrong:** Event listeners not registered when service worker restarts
**Why it happens:** Async operations before addEventListener; listeners registered in callbacks
**How to avoid:**
- Verify all listeners registered synchronously in defineBackground()
- Test that listeners exist immediately after module load
- Use vi.spyOn to verify registration timing
**Warning signs:** Listeners registered inside async functions or Promises

### Pitfall 3: Fake Browser State Leaking Between Tests
**What goes wrong:** Tests pass individually but fail when run together
**Why it happens:** Missing fakeBrowser.reset() in beforeEach
**How to avoid:**
- Always call fakeBrowser.reset() in vitest.setup.ts beforeEach
- Run tests with --no-threads to catch ordering issues
- Use describe blocks to scope test state
**Warning signs:** Test failures only in full suite runs; "already exists" errors

### Pitfall 4: E2E Tests Flaky Due to Extension Loading
**What goes wrong:** Tests fail randomly with "extension not found" or "no service worker"
**Why it happens:** Extension not fully loaded before test runs; service worker not spawned
**How to avoid:**
- Wait for serviceworker event in fixture before use
- Use Playwright's auto-waiting for elements
- Add explicit waits after navigation to extension pages
**Warning signs:** Tests pass locally but fail in CI; inconsistent timing errors

### Pitfall 5: Coverage Thresholds Too Aggressive
**What goes wrong:** CI fails on legitimate changes; developers bypass coverage
**Why it happens:** 100% thresholds on code with browser-specific branches
**How to avoid:**
- Set realistic thresholds: 90% for business logic, 70% global
- Exclude types.ts and test files from coverage
- Use per-file thresholds for critical modules
**Warning signs:** Frequent threshold adjustments; many // istanbul ignore comments

### Pitfall 6: Mock Pages Don't Match Real Zendesk
**What goes wrong:** E2E tests pass but navigation interception fails on real Zendesk
**Why it happens:** Mock pages use simplified URLs that don't trigger URL matching
**How to avoid:**
- Mock pages must use realistic URLs: https://mock.zendesk.com/agent/tickets/123
- Test all URL patterns from url-matching.ts
- Include restricted route tests (chat, voice, print)
**Warning signs:** Tests only cover happy path; no edge case URL testing

## Code Examples

Verified patterns from official sources:

### URL Matching Unit Tests
```typescript
// src/utils/url-matching.test.ts
import { describe, it, expect } from 'vitest';
import { matchZendeskUrl, buildZendeskUrl, isZendeskAgentUrl } from './url-matching';

describe('matchZendeskUrl', () => {
  describe('valid Zendesk URLs', () => {
    it('matches agent ticket URLs', () => {
      const result = matchZendeskUrl('https://company.zendesk.com/agent/tickets/123');
      expect(result).toEqual({
        subdomain: 'company',
        path: '/tickets/123',
        type: 'ticket',
      });
    });

    it('matches lotus routes', () => {
      const result = matchZendeskUrl('https://company.zendesk.com/agent/dashboard');
      expect(result).toEqual({
        subdomain: 'company',
        path: '/dashboard',
        type: 'lotus',
      });
    });

    it('ignores query parameters', () => {
      const result = matchZendeskUrl('https://company.zendesk.com/agent/tickets/123?foo=bar');
      expect(result?.path).toBe('/tickets/123');
    });

    it('ignores hash fragments', () => {
      const result = matchZendeskUrl('https://company.zendesk.com/agent/tickets/123#section');
      expect(result?.path).toBe('/tickets/123');
    });
  });

  describe('restricted routes', () => {
    it('returns null for chat routes', () => {
      expect(matchZendeskUrl('https://company.zendesk.com/agent/chat')).toBeNull();
    });

    it('returns null for talk routes', () => {
      expect(matchZendeskUrl('https://company.zendesk.com/agent/talk')).toBeNull();
    });

    it('returns null for print routes', () => {
      expect(matchZendeskUrl('https://company.zendesk.com/tickets/123/print')).toBeNull();
    });
  });

  describe('invalid URLs', () => {
    it('returns null for non-Zendesk domains', () => {
      expect(matchZendeskUrl('https://example.com/agent/tickets/123')).toBeNull();
    });

    it('returns null for malformed URLs', () => {
      expect(matchZendeskUrl('not-a-url')).toBeNull();
    });

    it('returns null for root Zendesk domain', () => {
      expect(matchZendeskUrl('https://zendesk.com/agent/tickets/123')).toBeNull();
    });
  });
});

describe('buildZendeskUrl', () => {
  it('constructs correct agent URL', () => {
    const url = buildZendeskUrl({ subdomain: 'company', path: '/tickets/123', type: 'ticket' });
    expect(url).toBe('https://company.zendesk.com/agent/tickets/123');
  });
});

describe('isZendeskAgentUrl', () => {
  it('returns true for agent URLs', () => {
    expect(isZendeskAgentUrl('https://company.zendesk.com/agent/dashboard')).toBe(true);
  });

  it('returns false for help center URLs', () => {
    expect(isZendeskAgentUrl('https://company.zendesk.com/hc/articles/123')).toBe(false);
  });
});
```

### E2E Navigation Test
```typescript
// e2e/navigation.spec.ts
import { test, expect } from './fixtures';

test.describe('Navigation Interception', () => {
  test('should intercept Zendesk ticket navigation', async ({ context, extensionId }) => {
    // Open first tab with mock Zendesk page
    const page1 = await context.newPage();
    await page1.goto('file://' + __dirname + '/mock-pages/agent-ticket.html');

    // Verify extension loaded
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(popup.locator('body')).toBeVisible();

    // Navigate to verify interception behavior
    // (Specific assertions depend on mock page setup)
  });
});
```

### Playwright Config for WXT
```typescript
// playwright.config.ts
// Source: https://wxt.dev/guide/essentials/e2e-testing
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Extensions need sequential context
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for extension testing
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Istanbul coverage | v8 with AST remapping | Vitest 3.2.0 | Same accuracy, 3x faster |
| jest-chrome | vitest-chrome / fake-browser | 2024 | Native Vitest support |
| Manifest V2 background page | MV3 service worker | Chrome 109+ | Must test termination |
| Headed-only extension tests | Headless with chromium channel | Playwright 1.49+ | CI-friendly |
| coverage.all option | coverage.include patterns | Vitest 4.0 | Explicit file selection |

**Deprecated/outdated:**
- **jest-webextension-mock**: Use vitest-chrome instead for Vitest projects
- **sinon-chrome**: Replaced by vitest-chrome with native Vitest support
- **Old headless mode**: Use `channel: 'chromium'` for new headless with extension support

## Open Questions

Things that couldn't be fully resolved:

1. **@webext-core/fake-browser webNavigation event support**
   - What we know: Storage APIs are fully implemented with stateful behavior
   - What's unclear: Whether webNavigation.onBeforeNavigate events can be triggered
   - Recommendation: Start with fake-browser; add vitest-chrome if event mocking needed

2. **Service worker termination simulation in unit tests**
   - What we know: E2E can test with real termination; unit tests use mocks
   - What's unclear: Best pattern for simulating termination in unit tests
   - Recommendation: Test storage persistence directly; use E2E for termination scenarios

3. **CI performance with Playwright extension tests**
   - What we know: Extension tests require single worker, sequential execution
   - What's unclear: Actual CI time impact for small test suite
   - Recommendation: Keep E2E suite small (5-10 critical paths); unit tests for coverage

## Sources

### Primary (HIGH confidence)
- [WXT Unit Testing Guide](https://wxt.dev/guide/essentials/unit-testing) - WxtVitest plugin, fake-browser usage
- [WXT E2E Testing Guide](https://wxt.dev/guide/essentials/e2e-testing) - Playwright integration
- [Playwright Chrome Extensions](https://playwright.dev/docs/chrome-extensions) - Extension fixture pattern
- [Vitest Coverage Config](https://vitest.dev/config/coverage) - Threshold syntax, reporter options

### Secondary (MEDIUM confidence)
- [vitest-chrome GitHub](https://github.com/probil/vitest-chrome) - Event mocking API
- [Chrome Service Worker Termination Testing](https://developer.chrome.com/docs/extensions/how-to/test/test-serviceworker-termination-with-puppeteer) - Termination patterns
- [Vitest Coverage Report Action](https://github.com/marketplace/actions/vitest-coverage-report) - CI integration

### Tertiary (LOW confidence)
- Various WebSearch results on best practices (verified against official docs where possible)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - WXT docs explicitly recommend these tools
- Architecture: HIGH - Based on official WXT examples and Playwright docs
- Pitfalls: MEDIUM - Compiled from multiple sources, some patterns project-specific

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable domain)

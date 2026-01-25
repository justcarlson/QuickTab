# Testing Patterns

**Analysis Date:** 2026-01-25

## Test Framework

**Runner:**
- Not detected - No test framework configured or in use
- Config: None found (no jest.config.js, vitest.config.js, or equivalent)

**Assertion Library:**
- Not configured - No testing library dependencies in package.json

**Run Commands:**
```bash
# Current test command (fails):
npm test              # Error: no test specified && exit 1
```

**Status:** No test suite implemented. Testing appears to be manual/external only.

## Test File Organization

**Location:**
- No test files found in codebase
- No `*.test.js`, `*.spec.js`, or test directories present
- Grep search for test files returned no results in project (excluding node_modules)

**Naming:**
- Not applicable - No test files detected

**Structure:**
- Not applicable - No test files detected

## Test Structure

**Current State:**
The codebase contains no automated tests. Code is organized for manual testing and Chrome extension runtime validation.

**If Tests Were Added:**
Based on module architecture, tests should follow this pattern:

```javascript
// Example structure for browser/tabs.js test
describe('tabs', function() {
  describe('remove', function() {
    it('should call chrome.tabs.remove with tabId', function() {
      // Test implementation
    });
  });

  describe('create', function() {
    it('should call chrome.tabs.create with url', function() {
      // Test implementation
    });
  });
});
```

## Mocking

**Framework:**
- Not configured - No mocking library detected
- No sinon.js, jest.mock, or similar dependencies

**Patterns:**
- If implemented, would need to mock Chrome API (`chrome.tabs`, `chrome.storage`, `chrome.webNavigation`)
- Module pattern allows for dependency injection via require() for testing

**What Would Need Mocking:**
- `chrome.tabs.*` - Tab manipulation APIs
- `chrome.storage.local.*` - Storage operations
- `chrome.webNavigation.*` - Navigation event listeners
- `chrome.runtime.*` - Extension runtime APIs
- `chrome.action.*` - Action/page action APIs

**What Should NOT Be Mocked:**
- Core business logic in URL matching (`modules/url_match.js`)
- Route extraction and comparison logic
- Storage fallback mechanisms when testing localStorage vs Chrome storage

## Fixtures and Factories

**Test Data:**
- Not implemented - No fixture files or factory functions detected

**If Implemented, Key Data Structures:**
```javascript
// Zendesk URL fixtures
const lotusUrl = 'https://mycompany.zendesk.com/agent/#/home';
const ticketUrl = 'https://mycompany.zendesk.com/agent/tickets/12345';
const restrictedUrl = 'https://mycompany.zendesk.com/agent/chat/rooms/123';

// Chrome tab fixtures
const tabFixture = {
  id: 123,
  windowId: 456,
  url: 'https://mycompany.zendesk.com/agent/#/home'
};

// Storage data fixtures
const storageFixture = {
  urlDetection: 'allUrls',
  currentversion: '0.11.8'
};
```

**Location:**
- Would be in `app/javascripts/__fixtures__/` or `test/fixtures/`
- Not currently present

## Coverage

**Requirements:**
- None enforced - No coverage configuration detected
- No coverage reporting in build process
- Not mentioned in package.json or Gruntfile

**View Coverage:**
- Not applicable - No test runner configured

## Test Types

**Unit Tests:**
- Not implemented
- Would test individual modules: `storage.js`, `url_match.js`, `tabs.js`, `i18n.js`
- Focus: Pure function logic and Chrome API wrapper behavior

**Integration Tests:**
- Not implemented
- Would test module interactions: `browser.js` composing multiple browser modules
- Focus: Navigation flow, storage coordination, popup interactions

**E2E Tests:**
- Not applicable for extension - Manual testing required
- Would test in actual Chrome environment with manifest v3
- Cannot be automated due to extension context limitations

## Common Patterns

**Async Testing:**
- Callbacks used throughout codebase instead of Promises/async-await
- Would require callback-based test patterns:

```javascript
it('should get storage value via callback', function(done) {
  storage.get('urlDetection', function(value) {
    expect(value).toBe('allUrls');
    done();
  });
});
```

**Error Testing:**
- Silent failure pattern used for JSON parsing and network errors
- Would test error paths:

```javascript
it('should handle JSON parse errors gracefully', function() {
  // Simulate invalid JSON scenario
  // Verify fallback behavior (keeping raw string)
});

it('should handle missing Chrome API gracefully', function() {
  // Mock chrome === undefined
  // Verify fallback to localStorage
});
```

## Architecture for Testing

**Testable Module Pattern:**
Current module structure enables testing:
- `browser/*` modules wrap Chrome APIs and can be isolated with mocks
- `modules/*` modules compose browser modules and contain business logic
- Requires statements at module top allow dependency replacement for testing

**Example testable module from `storage.js`:**
```javascript
// Module checks for chrome.storage availability and falls back to localStorage
// This dual-path logic should be tested separately

var hasChromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

var storage = {
  get: function(key, callback) {
    if (hasChromeStorage) {
      // Test path 1: Chrome storage path
    } else {
      // Test path 2: localStorage fallback path
    }
  }
};
```

## Recommended Testing Strategy (If Implemented)

**Priority Order:**
1. **URL Matching Logic** (`modules/url_match.js`) - Core business logic with regex patterns
   - Test route matching for Lotus, Tickets, Restricted URLs
   - Verify subdomain and path extraction
   - Critical: Most bug-prone code path

2. **Storage Layer** (`browser/storage.js`) - Fallback mechanisms
   - Test Chrome storage path
   - Test localStorage fallback path
   - Test JSON parsing error handling

3. **Module Integration** (`modules/browser.js`) - Composition and workflows
   - Test navigation handling workflow
   - Test installation/update workflows
   - Mock underlying browser modules

4. **Event Listeners** (`browser/listeners.js`) - Event registration
   - Test listener registration logic
   - Mock chrome.webNavigation events
   - Low priority: Mostly setup code

**Framework Recommendation:**
- Jest with fake timers for Promise-based tests
- Sinon for Chrome API mocking
- Requires migration from callbacks to Promises or async/await

---

*Testing analysis: 2026-01-25*

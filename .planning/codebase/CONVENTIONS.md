# Coding Conventions

**Analysis Date:** 2026-01-25

## Naming Patterns

**Files:**
- Kebab-case for browser-level modules: `page_action.js`, `url_match.js`
- camelCase for application-level files: `tabWatcher.js`, `popup.js`, `welcome.js`
- Underscore-separated words in some modules: `browser/page_action.js`, `browser/i18n.js`
- Pattern: descriptive, singular or plural noun corresponding to module responsibility

**Functions:**
- camelCase for all function names: `extractMatches()`, `setUrlDetection()`, `sanitize()`
- Prefix private methods with underscore: `_getLotusUrlMatches()`, `_getTicketUrlMatches()`, `_checkForRestrictedMatches()`, `_registerHandlebarsHelpers()`
- Method names are action verbs: `get()`, `set()`, `remove()`, `query()`, `focus()`, `create()`

**Variables:**
- camelCase for all variable names: `popupSettings`, `urlDetection`, `tabId`, `windowId`
- Descriptive names indicating type/content: `matchZendeskUrl`, `lotusUrlMatches`, `ticketUrlMatches`
- Convention to use `self = this` for preserving context in callbacks
- No Hungarian notation or type prefixes

**Types:**
- Plain JavaScript objects used as object literals representing modules
- No explicit TypeScript; JSHint used for type checking
- Constants defined as UPPERCASE: `LOTUS_ROUTE`, `TICKET_ROUTE`, `RESTRICTED_ROUTE` (regex patterns)

**Constants:**
- UPPERCASE_WITH_UNDERSCORES for regex routes and configuration constants
- Examples: `LOTUS_ROUTE`, `TICKET_ROUTE`, `RESTRICTED_ROUTE`

## Code Style

**Formatting:**
- JSHint enforced with `.jshintrc` configuration
- 2-space indentation (configured in `.jshintrc`: `"indent": 2`)
- Max line length: 200 characters (`"maxlen": 200`)
- Curly braces required for all control structures (`"curly": true`)
- Trailing commas and whitespace checked (`"trailing": true`)

**Linting:**
- Tool: JSHint via Grunt task
- Config file: `/home/jc/developer/QuickTab/.jshintrc`
- Run command: `grunt jshint` (part of default build)
- Key rules enforced:
  - `"eqeqeq": true` - Strict equality operators (=== instead of ==)
  - `"undef": true` - Undefined variable checking
  - `"expr": true` - Allow expression statements
  - `"devel": true` - Allow console, alert debugging functions
  - `"browser": true` - Browser globals
  - Predefined globals: jQuery ($), underscore (_), Handlebars, Ember, Chrome APIs, etc.

## Import Organization

**Order:**
1. CommonJS requires (modules from `./modules/` and `../browser/`)
2. Variable declarations after all requires
3. No separate groups; all dependencies at top of file

**Path Aliases:**
- Relative paths only: `require('./modules/popup.js')`, `require('../browser/listeners.js')`
- No path aliases configured
- Webpack used as bundler; entry points: `popup.js`, `tabWatcher.js`, `welcome.js`

**Example pattern from `popup.js`:**
```javascript
var templates = require('./templates.js'),
    browser   = require('./browser.js');
```

**Example pattern from `modules/browser.js`:**
```javascript
var urlMatch = require('./url_match.js');

var browser = {
  tabs:       require('../browser/tabs.js'),
  pageAction: require('../browser/page_action.js'),
  i18n:       require('../browser/i18n.js'),
  storage:    require('../browser/storage.js'),
  extension:  require('../browser/extension.js'),
```

## Error Handling

**Patterns:**
- No explicit error handling for most async operations; callbacks optional
- Silent failures with fallback values in storage module when Chrome APIs unavailable
- Try-catch used only for JSON parsing and external requests (e.g., `i18n.js`)
- Graceful degradation: falls back to localStorage when chrome.storage unavailable
- Callbacks checked before invocation: `if (callback) { callback(); }`

**Example from `storage.js`:**
```javascript
if (value) {
  try {
    value = JSON.parse(value);
  } catch (error) {
    // keep raw string
  }
}
```

**Example fallback pattern:**
```javascript
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
  // Use Chrome API
} else {
  // Fallback to localStorage
}
```

## Logging

**Framework:** Console methods (console.log, console.error) allowed via JSHint `"devel": true`

**Patterns:**
- No structured logging framework
- Console available for debugging as per JSHint config
- No persistent logging mechanism detected

## Comments

**When to Comment:**
- Inline comments on same line or preceding line for non-obvious logic
- Block comments for listener registration explaining what triggers it
- Comments explain "why" not "what" the code does

**Patterns:**
- Single-line comments with `//` prefix
- Comments describe listener registration conditions and event types
- Example from `listeners.js`:
  ```javascript
  // Adds page action to any /agent URLs
  chrome.webNavigation.onDOMContentLoaded.addListener(function(details) {
  ```

**JSDoc/TSDoc:**
- Not used; no documentation comments detected
- Plain comments for explanation only

## Function Design

**Size:**
- Small focused functions, typically 10-50 lines
- Largest functions around 20 lines for algorithmic logic
- Single responsibility: one function per task

**Parameters:**
- Minimal parameters; context passed via object literals or `this` binding
- Callbacks commonly passed as final parameter
- Destructured URL patterns via regex matching

**Return Values:**
- Most functions return void or null for async operations
- Callback-based control flow used throughout
- Some functions return extracted data: `_getRouteDetails()` returns object, `extractMatches()` returns matches or null

**Example function design from `url_match.js`:**
```javascript
extractMatches: function(url, urlDetection) {
  var matches            = null,
      lotusUrlMatches    = this._getLotusUrlMatches(url),
      ticketUrlMatches   = this._getTicketUrlMatches(url),
      restrictedMatches  = this._checkForRestrictedMatches(url);

  if (!restrictedMatches) {
    if (ticketUrlMatches) {
      matches = ticketUrlMatches;
    } else if (lotusUrlMatches && (urlDetection === 'allUrls')) {
      matches = lotusUrlMatches;
    }
  }

  return matches;
}
```

## Module Design

**Exports:**
- Single export per file: `module.exports = objectOrFunction`
- Objects for singleton module instances with methods
- Each module represents a logical domain (storage, browser tabs, URL matching, etc.)

**Pattern - Module as Object Literal:**
```javascript
var moduleName = {
  method1: function() { },
  method2: function() { },
  _privateMethod: function() { }
};

module.exports = moduleName;
```

**Module Architecture:**
- `browser/` modules: Low-level Chrome API wrappers
- `modules/` modules: Business logic and composition
- Dependency injection via requires at top of file
- Each browser module maps to single Chrome API or feature area

**Example structure from `modules/browser.js`:**
```javascript
var browser = {
  tabs:       require('../browser/tabs.js'),
  pageAction: require('../browser/page_action.js'),
  i18n:       require('../browser/i18n.js'),
  storage:    require('../browser/storage.js'),
  extension:  require('../browser/extension.js'),
  // ... methods
};
```

## File Organization

**Directory Structure:**
- `app/javascripts/browser/` - Chrome API wrapper modules
- `app/javascripts/modules/` - Business logic and application services
- `app/javascripts/` - Entry points and initialization files

**Key Locations:**
- `popup.js` - Entry point for popup context
- `tabWatcher.js` - Entry point for service worker/background
- `welcome.js` - Entry point for welcome page
- `modules/browser.js` - Main composition module aggregating all browser API wrappers
- `modules/popup.js` - Popup UI initialization and bindings

---

*Convention analysis: 2026-01-25*

# Architecture

**Analysis Date:** 2026-01-25

## Pattern Overview

**Overall:** Browser Extension (Chrome Manifest V3) with Modular Service Layer Pattern

**Key Characteristics:**
- Service worker (background script) handles all browser events and tab management
- Modular abstraction layer decouples business logic from Chrome API specifics
- Popup UI communicates with service worker via user interactions
- URL matching engine determines when to intercept and forward navigation
- Configuration persisted via Chrome storage (with fallback to localStorage)

## Layers

**Chrome API Abstraction Layer:**
- Purpose: Isolate Chrome-specific APIs behind reusable interfaces
- Location: `app/javascripts/browser/`
- Contains: `tabs.js`, `storage.js`, `page_action.js`, `extension.js`, `i18n.js`
- Depends on: Native Chrome APIs (`chrome.tabs`, `chrome.storage`, `chrome.action`)
- Used by: Core business logic modules in `app/javascripts/modules/`

**Business Logic Layer:**
- Purpose: Implement feature-specific logic (URL matching, navigation handling, settings)
- Location: `app/javascripts/modules/`
- Contains: `browser.js`, `popup.js`, `url_match.js`, `templates.js`
- Depends on: Chrome abstraction layer
- Used by: Entry points (popup.js, tabWatcher.js, welcome.js)

**UI/Template Layer:**
- Purpose: Render and manage popup UI with Handlebars templates
- Location: `app/templates/` (Handlebars templates), `app/javascripts/modules/templates.js`
- Contains: `popup.handlebars`, `welcome.handlebars`, compiled template helpers
- Depends on: Business logic layer for data/settings
- Used by: UI scripts (popup.js, welcome.js)

**Service Worker Entry Point:**
- Purpose: Initialize background service worker and register event listeners
- Location: `app/javascripts/tabWatcher.js`
- Contains: Minimal wrapper requiring `browser/listeners.js`
- Depends on: Listener registry
- Used by: Chrome runtime (manifest.json background script)

**Popup Entry Point:**
- Purpose: Initialize popup UI when extension icon is clicked
- Location: `app/javascripts/popup.js`
- Contains: jQuery ready handler calling `popup.init()`
- Depends on: `modules/popup.js`
- Used by: Chrome popup (manifest.json action.default_popup)

## Data Flow

**Navigation Flow (User clicks Zendesk link):**

1. Chrome fires `webNavigation.onBeforeNavigate` event on any zendesk.com URL
2. `browser/listeners.js` catches event, calls `browser.didNavigate(navDetails)`
3. `modules/browser.js` extracts URL and loads `urlDetection` setting from storage
4. `modules/url_match.js` tests URL against patterns (LOTUS_ROUTE, TICKET_ROUTE, RESTRICTED_ROUTE)
5. If match found and not restricted, calls `browser.openRouteInZendesk(tab)`
6. Searches for existing Zendesk agent tab with same subdomain
7. Executes `chrome.scripting.executeScript()` to post message with route to target tab
8. Removes original tab from the navigation URL pattern

**Settings Flow (User changes detection mode):**

1. User clicks link in popup (e.g., "All URLs", "Ticket URLs", "Disabled")
2. `modules/popup.js` bindings call `popup.setUrlDetection(option)`
3. Setting persisted via `browser.storage.set('urlDetection', option)`
4. Storage abstraction (`browser/storage.js`) writes to `chrome.storage.local` or `localStorage`
5. Icon state updated via `browser.pageAction.setIcon(iconState)`
6. Popup closes and extension reflects new state

**Installation Flow (First run):**

1. Chrome fires `runtime.onInstalled` event
2. `browser.didInstall(details)` queries all open zendesk.com/agent tabs
3. For each tab, calls `browser.addPageAction(tabId)` to show extension icon
4. If reason is 'install', opens welcome page via `browser.openWelcome()`
5. Initializes default settings via `storage.sanitize()`

**State Management:**

- **Active Settings:** `urlDetection` (allUrls | ticketUrls | noUrls) stored in Chrome storage
- **Disabled Duration:** `disabledFor` tracked in storage (used in popup display)
- **Runtime State:** No in-memory state persisted between navigation events
- **Template Settings:** `templates.settings` object holds current config for UI rendering

## Key Abstractions

**browser Module (`modules/browser.js`):**
- Purpose: Orchestrate all browser interactions (tabs, storage, navigation, icons)
- Examples: `browser.addPageAction()`, `browser.didNavigate()`, `browser.openRouteInZendesk()`
- Pattern: Singleton with methods that delegate to sub-modules, uses callback-based async

**popup Module (`modules/popup.js`):**
- Purpose: Manage popup UI initialization and event bindings
- Examples: `popup.init()`, `popup.setUrlDetection()`, `popup.disable()`
- Pattern: Singleton with methods for initialization and UI control, manages user interactions

**urlMatch Module (`modules/url_match.js`):**
- Purpose: Parse Zendesk URLs and extract route information
- Examples: `urlMatch.extractMatches()`, private methods `_getLotusUrlMatches()`, `_getTicketUrlMatches()`
- Pattern: Static module with regex-based URL parsing and decision logic

**templates Module (`modules/templates.js`):**
- Purpose: Manage Handlebars template rendering and helper registration
- Examples: `templates.show()`, `templates.render()`, custom Handlebars helpers (t, enabledSetting)
- Pattern: Singleton with template initialization and rendering methods

**Storage Abstraction (`browser/storage.js`):**
- Purpose: Provide unified API for storage with fallback from Chrome storage to localStorage
- Pattern: Async callback-based API, handles both sync (localStorage) and async (chrome.storage) backends

## Entry Points

**Service Worker (`app/javascripts/tabWatcher.js`):**
- Location: `app/javascripts/tabWatcher.js`
- Triggers: Chrome runtime initialization when extension loads
- Responsibilities: Require and initialize listener registry, keep service worker active

**Popup UI (`app/javascripts/popup.js`):**
- Location: `app/javascripts/popup.js`
- Triggers: User clicks extension icon
- Responsibilities: Initialize popup UI, load settings, bind click handlers

**Welcome Page (`app/javascripts/welcome.js`):**
- Location: `app/javascripts/welcome.js`
- Triggers: First install or user clicks "Welcome" in popup
- Responsibilities: Render welcome/onboarding template

**Listener Registry (`app/javascripts/browser/listeners.js`):**
- Location: `app/javascripts/browser/listeners.js`
- Triggers: Service worker initialization
- Responsibilities: Register Chrome event listeners for navigation and install events

## Error Handling

**Strategy:** Callback-based error recovery with graceful degradation

**Patterns:**

- **Storage Fallback:** If `chrome.storage` unavailable, falls back to `localStorage` (app/javascripts/browser/storage.js:1-32)
- **Sync vs Async:** Operations accept optional callbacks but continue without them if missing
- **String Lookup Fallback:** i18n.getString() returns "String not found: [key]" for missing translations (app/javascripts/browser/i18n.js:6, 29)
- **URL Matching Safety:** Checks for restricted routes before allowing navigation (app/javascripts/modules/url_match.js:59-62)
- **Try-Catch for XHR:** i18n fallback loading wraps XMLHttpRequest in try-catch (app/javascripts/browser/i18n.js:13-22)

## Cross-Cutting Concerns

**Logging:** Not implemented - no logging framework

**Validation:** URL pattern matching via regex (app/javascripts/modules/url_match.js:5-7), storage key existence checks

**Authentication:** None - extension operates within Zendesk domain constraints via manifest host_permissions

**I18n:** Two-tier system via `modules/templates.js` Handlebars helper:
1. Primary: `chrome.i18n.getMessage()` for localized strings
2. Fallback: XHR load of `_locales/en/messages.json` for dev/test environments

---

*Architecture analysis: 2026-01-25*

# Codebase Structure

**Analysis Date:** 2026-01-25

## Directory Layout

```
/home/jc/developer/QuickTab/
├── app/                       # Source files for extension
│   ├── javascripts/           # JavaScript entry points and modules
│   │   ├── browser/           # Chrome API abstraction layer
│   │   ├── modules/           # Business logic and utilities
│   │   ├── popup.js           # Popup UI entry point
│   │   ├── tabWatcher.js      # Service worker entry point
│   │   └── welcome.js         # Welcome page entry point
│   ├── templates/             # Handlebars templates
│   ├── stylesheets/           # SCSS source stylesheets
│   ├── vendor/                # Third-party JS (jQuery, Handlebars)
│   ├── images/                # Icons and page images
│   ├── _locales/              # Internationalization strings
│   ├── manifest.json          # Chrome extension manifest
│   ├── popup.html             # Popup UI HTML shell
│   └── welcome.html           # Welcome page HTML shell
├── build/                     # Compiled/bundled extension (generated)
│   ├── javascripts/           # Webpack-compiled bundles
│   ├── stylesheets/           # Compiled CSS
│   ├── images/                # Copied icons
│   ├── _locales/              # Copied i18n files
│   ├── vendor/                # Copied vendor files
│   ├── manifest.json          # Copied manifest
│   ├── popup.html             # Copied HTML
│   └── welcome.html           # Copied HTML
├── Gruntfile.js               # Build automation
├── package.json               # NPM dependencies and metadata
└── .planning/                 # GSD planning documents (this location)
```

## Directory Purposes

**`app/`:**
- Purpose: All source files for the Chrome extension
- Contains: HTML, JavaScript (CommonJS modules), SCSS templates, images, i18n
- Key files: `manifest.json` (extension config), entry point files

**`app/javascripts/`:**
- Purpose: All JavaScript source code
- Contains: Entry points, business logic, and Chrome API abstractions
- Key files: `popup.js`, `tabWatcher.js`, `welcome.js` (entry points)

**`app/javascripts/browser/`:**
- Purpose: Chrome API abstraction layer (Adapter pattern)
- Contains: Thin wrappers around Chrome APIs (`chrome.tabs`, `chrome.storage`, `chrome.action`, etc.)
- Key files:
  - `tabs.js`: Tab query, focus, create, remove, executeScript operations
  - `storage.js`: Persistent state with chrome.storage/localStorage fallback
  - `page_action.js`: Extension icon visibility and state
  - `i18n.js`: Message localization with fallback loading
  - `extension.js`: Extension URL resolution

**`app/javascripts/modules/`:**
- Purpose: Business logic and feature implementation
- Contains: URL matching, navigation handling, popup UI logic, template rendering
- Key files:
  - `browser.js`: Orchestrator module coordinating all browser interactions
  - `popup.js`: Popup UI initialization and settings management
  - `url_match.js`: Zendesk URL pattern matching and route extraction
  - `templates.js`: Handlebars template management and helpers

**`app/templates/`:**
- Purpose: Handlebars templates for dynamic UI rendering
- Contains: Template files compiled by grunt-contrib-handlebars
- Key files:
  - `popup.handlebars`: Popup UI template with settings options
  - `welcome.handlebars`: Welcome/onboarding template

**`app/stylesheets/`:**
- Purpose: SCSS source for extension UI styling
- Contains: SCSS partials and compiled CSS output
- Key files:
  - `popup.scss`: Popup UI styles
  - `welcome.scss`: Welcome page styles
  - `_variables.scss`: SCSS variables and mixins
  - `_icons.scss`: Icon styling

**`app/vendor/javascripts/`:**
- Purpose: Third-party JavaScript libraries
- Contains: jQuery and Handlebars bundled with extension
- Key files: Used in popup.html and welcome.html via script tags

**`app/images/`:**
- Purpose: Icons and visual assets
- Contains: Subdirectories for different image types
- Key files:
  - `icons/icon-19.png`, `icon-38.png`: Extension icon variants
  - `pages/`: Screenshot images used in welcome page

**`app/_locales/en/`:**
- Purpose: Internationalization strings
- Contains: Chrome i18n message format JSON files
- Key files: `messages.json` with translatable strings referenced in templates via {{t}} helper

**`build/`:**
- Purpose: Compiled extension ready for distribution or installation
- Contains: Webpack bundles, compiled CSS, processed assets
- Generated: Yes (by Grunt)
- Committed: No (added to .gitignore)
- Key subdirectories mirror app/ structure with compiled output

## Key File Locations

**Entry Points:**
- `app/javascripts/popup.js`: Popup UI initialization (jQuery ready → popup.init())
- `app/javascripts/tabWatcher.js`: Service worker initialization (requires browser/listeners.js)
- `app/javascripts/welcome.js`: Welcome page initialization (jQuery ready → templates.show())

**Configuration:**
- `app/manifest.json`: Chrome extension manifest (permissions, background script, action, icons)
- `package.json`: NPM dependencies and version
- `Gruntfile.js`: Build tasks (webpack bundling, SCSS compilation, file copying)

**Core Logic:**
- `app/javascripts/modules/browser.js`: Main orchestrator module
- `app/javascripts/modules/url_match.js`: URL pattern matching and route extraction
- `app/javascripts/modules/popup.js`: Popup UI logic and settings binding
- `app/javascripts/browser/storage.js`: Persistent state management

**UI Templates:**
- `app/templates/popup.handlebars`: Popup settings UI
- `app/templates/welcome.handlebars`: Welcome/onboarding UI
- `app/popup.html`: Popup HTML shell
- `app/welcome.html`: Welcome page HTML shell

**Styling:**
- `app/stylesheets/popup.scss`: Popup UI styles
- `app/stylesheets/welcome.scss`: Welcome page styles

**Testing:**
- Not present in codebase (package.json has no test script, no test files found)

## Naming Conventions

**Files:**
- `camelCase.js`: JavaScript files (e.g., `tabWatcher.js`, `popup.js`)
- `snake_case.scss`: SCSS files (e.g., `_variables.scss`, `_icons.scss`)
- `.handlebars`: Template files (e.g., `popup.handlebars`)
- `.html`: Static HTML shells (e.g., `popup.html`, `welcome.html`)
- `.json`: Configuration and localization (manifest.json, messages.json)

**Directories:**
- `camelCase/`: Lowercase with optional camelCase (e.g., `javascripts/`, `_locales/`)
- Module directories group by function: `browser/` (APIs), `modules/` (logic), `templates/` (UI), `vendor/` (external)

**Module Exports:**
- Named modules: `module.exports = { methodName: function() {...} }` (e.g., `browser.js`, `popup.js`)
- Object-based interfaces with methods rather than classes

## Where to Add New Code

**New Feature (e.g., new URL detection mode):**
- Primary code: `app/javascripts/modules/url_match.js` (add new pattern/method)
- UI: `app/templates/popup.handlebars` (add new option)
- Settings handler: `app/javascripts/modules/popup.js` (new case in setUrlDetection switch)
- Business logic: `app/javascripts/modules/browser.js` (handle new mode in didNavigate)
- Styles: `app/stylesheets/popup.scss` (style new UI element)

**New Chrome API Integration:**
- Abstraction: `app/javascripts/browser/[api-name].js` (new thin wrapper module)
- Consumer: `app/javascripts/modules/browser.js` (require and use abstraction)
- Entry points may also require([api]) if direct access needed

**New UI Page/Component:**
- Template: `app/templates/[page-name].handlebars`
- HTML shell: `app/[page-name].html`
- JavaScript logic: `app/javascripts/[page-name].js` (entry point)
- Styles: `app/stylesheets/[page-name].scss`

**Utilities/Helpers:**
- Reusable logic: `app/javascripts/modules/[helper-name].js` (CommonJS module export)
- If Chrome-API specific: `app/javascripts/browser/[helper-name].js`

## Special Directories

**`build/`:**
- Purpose: Compiled extension artifacts
- Generated: Yes (by `grunt build`)
- Committed: No
- Note: Ready to load in Chrome via unpacked extension installation

**`app/vendor/`:**
- Purpose: Third-party libraries included with extension
- Generated: No
- Committed: Yes (jQuery and Handlebars bundled, not via npm)
- Note: Loaded globally in HTML, exposed to modules via webpack externals

**`app/_locales/`:**
- Purpose: Chrome i18n message catalog
- Generated: No
- Committed: Yes
- Note: Only 'en' locale present; additional languages require subdirectories

**`.planning/codebase/`:**
- Purpose: GSD planning documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: No
- Committed: Yes
- Note: Not part of distributed extension, for development reference only

---

*Structure analysis: 2026-01-25*

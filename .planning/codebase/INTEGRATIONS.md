# External Integrations

**Analysis Date:** 2026-01-25

## APIs & External Services

**Chrome Extensions API:**
- webNavigation API - Listen for page navigation events to detect Zendesk URLs
  - Implementation: `app/javascripts/browser/listeners.js`
  - Events: onDOMContentLoaded, onBeforeNavigate, onCommitted
  - Filters: Watches for `zendesk.com` host suffix and `zendesk.com/agent` URL patterns

- Tabs API - Manage browser tabs (create, update, remove, focus, query)
  - Implementation: `app/javascripts/browser/tabs.js`
  - Methods: chrome.tabs.create, update, remove, query, focus
  - Scripting: chrome.scripting.executeScript for injecting route messages

- Runtime API - Extension lifecycle management
  - Implementation: `app/javascripts/browser/listeners.js`
  - Events: chrome.runtime.onInstalled (detect first install)
  - Methods: chrome.runtime.getURL for asset resolution

- Storage API - Persistent user settings
  - Implementation: `app/javascripts/browser/storage.js`
  - Fallback: localStorage for environments without chrome.storage.local
  - Key data stored: 'urlDetection' (link detection mode), 'disabledFor', 'currentversion'

- i18n API - Internationalization
  - Implementation: `app/javascripts/browser/i18n.js`
  - Fallback: Direct JSON loading from `app/_locales/en/messages.json`
  - Currently: English only

- Action API - Extension icon management
  - Implementation: `app/javascripts/browser/page_action.js`
  - Methods: chrome.action.enable, setIcon
  - Icons: 19px and 38px variants for different DPI displays

## Zendesk Integration

**Target Domain:**
- http://*.zendesk.com/* (HTTP and HTTPS)
- Specific routes monitored:
  - `/agent/*` - Main agent interface (via webNavigation filter)
  - `/tickets` - Ticket listing
  - `/agent/tickets` - Ticket listing variant
  - `/twickets` - Legacy ticket variant
  - `/requests` - Help center requests
  - `/hc/requests` - Help center requests variant

**URL Pattern Matching:**
- LOTUS_ROUTE: `/agent/` tickets (excludes chat/voice)
- TICKET_ROUTE: Ticket and request URLs
- RESTRICTED_ROUTE: Chat, voice, admin URLs (not intercepted)
- Implementation: `app/javascripts/modules/url_match.js`

**Tab Routing:**
- When Zendesk `/agent` link detected: routes to existing agent tab if open
- Sends messages via `window.postMessage` with route hash
- Falls back to new tab if no agent tab exists

## Data Storage

**Databases:** None

**Local Storage:**
- Chrome Extension Storage API (`chrome.storage.local`)
- Fallback: Browser localStorage for non-Chrome environments
- Stored settings:
  - `urlDetection`: Link detection mode ('allUrls', 'ticketUrls', or 'noUrls')
  - `disabledFor`: Duration when extension is disabled
  - `currentversion`: Track version for welcome page on updates

**File Storage:**
- Local assets only (no remote file uploads)
- Bundled with extension: icons, templates, stylesheets, localization

## Authentication & Identity

**Auth Provider:** None

**Security Model:**
- No user authentication required
- Extension runs in user's browser context
- Chrome permissions restrict access to Zendesk domains only
- No external credentials stored

## Monitoring & Observability

**Error Tracking:** None

**Logs:** None
- No remote logging or telemetry
- Uses console for debugging (disabled in production builds)

**Analytics:** None

## CI/CD & Deployment

**Hosting:**
- GitHub repository (community-maintained fork)
- Original: https://github.com/zendesklabs/QuickTab
- Installation: Manual unpacked extension load (not Chrome Web Store)

**CI Pipeline:** None detected
- No GitHub Actions workflows for testing
- Manual release process via Grunt tasks

**Release Workflow:**
- `grunt release:[patch|minor|major]` - Bumps version, builds, creates ZIP
- `grunt release:dryrun` - Test build without version bump
- Archives created in `releases/` directory
- Version updated in `app/manifest.json` and `package.json`

## Environment Configuration

**Required env vars:** None

**Secrets location:** None
- No API keys or authentication tokens
- No credentials management

## Webhooks & Callbacks

**Incoming:** None

**Outgoing:** None
- No external API calls
- No webhook notifications sent
- Communication limited to Chrome APIs and message passing within Zendesk tabs

---

*Integration audit: 2026-01-25*

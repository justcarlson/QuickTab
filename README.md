# QuickTab for Zendesk

Well-behaved browser tabs for Zendesk agents.

![QuickTab hero](app/images/pages/welcome/hero-v2.png)

QuickTab keeps Zendesk `/agent` links in one calm, focused tab. Click any agent link from anywhere and QuickTab routes it to the Zendesk tab you already have open.

## Installation

### From GitHub Releases (Recommended)

1. Download the latest `.zip` from [Releases](https://github.com/justcarlson/QuickTab/releases)
2. Unzip the download
3. Open `chrome://extensions` and enable **Developer mode**
4. Click **Load unpacked** and select the unzipped folder

### Chrome Web Store

Coming soon — submission in progress.

## Why teams use it

- Keep one working agent tab instead of a tab pile
- Jump from chat, email, or docs without losing context
- Toggle link handling on or off in seconds

## How it works

QuickTab watches for Zendesk `/agent` URLs. If an agent tab exists, it reuses that tab and navigates there. If not, it opens the link as normal.

## Using QuickTab

- Click any Zendesk `/agent` link in Slack, email, or docs and it routes to your open Zendesk tab
- Choose detection mode: all agent URLs, ticket URLs only, or disabled
- Toggle QuickTab off from the toolbar icon when you need a fresh tab

## Permissions

QuickTab requests minimal permissions to function:

| Permission | Why We Need It |
|------------|----------------|
| **zendesk.com access** | To detect Zendesk `/agent` navigation and route to existing tabs |
| **Tab access** | To find your existing Zendesk tabs and focus them when routing |
| **Storage** | To save your detection mode preference between browser sessions |
| **Web navigation** | To intercept link clicks before they open new tabs |
| **Scripting** | To send navigation messages to Zendesk's single-page app (avoids page reloads) |

### What We Don't Request

- No access to other websites (scripting limited to zendesk.com for navigation only)
- No access to your browsing history
- No access to cookies or passwords
- No data collection or analytics

For complete details, see our [Privacy Policy](PRIVACY.md).

## Development

This is the actively maintained fork of QuickTab. The codebase was modernized in January 2026:

- **Build:** WXT + Vite (replaces Grunt)
- **Language:** TypeScript with strict mode (replaces ES5 + jQuery)
- **Testing:** Vitest unit tests + Playwright E2E
- **CI:** GitHub Actions for lint, test, build on every PR

### Quick Start

```bash
npm install
npm run dev      # Start dev server with HMR
npm run build    # Production build
npm run test     # Run unit tests
npm run zip      # Create distribution ZIP
```

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Project Status

| Component | Status |
|-----------|--------|
| Core functionality | ✅ Stable |
| Chrome support | ✅ Supported |
| Firefox support | ❌ Not planned |
| Chrome Web Store | 🔄 Submission pending |

## Links

- **Releases:** https://github.com/justcarlson/QuickTab/releases
- **Issues:** https://github.com/justcarlson/QuickTab/issues
- **Original repo (archived):** https://github.com/zendesklabs/QuickTab

---

This is an independent community-maintained project and is not affiliated with Zendesk.

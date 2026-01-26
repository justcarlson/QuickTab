# QuickTab for Zendesk
Well-behaved browser tabs for Zendesk agents.

![QuickTab hero](app/images/pages/welcome/hero-v2.png)

QuickTab keeps Zendesk `/agent` links in one calm, focused tab. Click any agent link from anywhere and QuickTab routes it to the Zendesk tab you already have open.

This is an independent community-maintained project and is not affiliated with Zendesk or Zendesk Labs. The original archived repository lives at https://github.com/zendesklabs/QuickTab.

## Why teams use it
- Keep one working agent tab instead of a tab pile
- Jump from chat, email, or docs without losing context
- Toggle link handling on or off in seconds

## How it works
QuickTab watches for Zendesk `/agent` URLs. If an agent tab exists, it reuses that tab and navigates there. If not, it opens the link as normal.

## Get started
1. Download the latest release from https://github.com/zendesklabs/QuickTab/releases.
2. Unzip the download.
3. Open `chrome://extensions` and enable Developer mode.
4. Click "Load unpacked" and select the unzipped folder.

## Using QuickTab
- Click any Zendesk `/agent` link in Slack, email, or docs and it routes to your open Zendesk tab.
- Want a fresh tab? Toggle QuickTab off from the toolbar icon, open the link, then toggle it back on.

## Permissions

QuickTab requests minimal permissions to function:

| Permission | Why We Need It |
|------------|----------------|
| **zendesk.com access** | To detect Zendesk `/agent` navigation and route to existing tabs |
| **Tab access** | To find your existing Zendesk tabs and focus them when routing |
| **Storage** | To save your detection mode preference between browser sessions |
| **Web navigation** | To intercept link clicks before they open new tabs |

### What We Don't Request

- No access to other websites
- No access to your browsing history
- No access to read page content
- No access to cookies or passwords

For complete details, see our [Privacy Policy](PRIVACY.md).

## Status
This extension is distributed as an unpacked install. It is not currently on the Chrome Web Store.

## Links
- Original archived repo: https://github.com/zendesklabs/QuickTab

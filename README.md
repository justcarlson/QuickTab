# Zendesk QuickTab
Well behaved browser tabs for Zendesk agents.

Zendesk QuickTab keeps Zendesk `/agent` links in one calm, focused tab. Click any agent link from anywhere and QuickTab routes it to the agent tab you already have open.

## Why teams use it
- Keep one working agent tab instead of a tab pile
- Jump from chat, email, or docs without losing context
- Toggle link handling on or off in seconds

## How it works
QuickTab watches for Zendesk `/agent` URLs. If an agent tab exists, it reuses that tab and navigates there. If not, it opens the link as normal.

## Install Locally
1. Download the latest release zip from `releases/` or build locally.
2. Unzip the archive.
3. Open `chrome://extensions` and enable Developer mode.
4. Click “Load unpacked” and select the `build/` folder.

## Build Locally
```bash
npm install
grunt build
```

## Permissions
QuickTab requests permission to read and change data on `zendesk.com` so it can detect and redirect `/agent` links.

## Status
This extension is distributed as an unpacked install. It is not currently on the Chrome Web Store.

## Links
- README: https://github.com/zendesklabs/QuickTab#readme
- Issues: https://github.com/zendesklabs/QuickTab/issues

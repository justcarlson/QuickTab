# Privacy Policy

**Effective Date:** January 2026
**Last Updated:** January 2026

---

## The Short Version

We don't collect your data. Period.

QuickTab runs entirely on your device. No data is sent anywhere. There are no servers, no accounts, no analytics—nothing leaves your browser.

---

## What QuickTab Accesses

QuickTab watches for navigation to zendesk.com domains to redirect links to existing agent tabs. This detection happens **locally in your browser**. No browsing data is transmitted anywhere.

---

## What QuickTab Stores

QuickTab stores exactly one preference: your detection mode setting (which Zendesk URLs to intercept).

This preference is stored using Chrome's local storage API (`chrome.storage.local`). It stays on your device and is never synced or transmitted.

---

## What QuickTab Does NOT Do

- **No analytics** — We don't track usage, clicks, or behavior
- **No tracking** — No cookies, fingerprinting, or identifiers
- **No accounts** — Nothing to sign up for
- **No external communication** — The extension never contacts any server
- **No data collection** — We literally cannot see your data

---

## Permissions Explained

QuickTab requests the following permissions. Here's why each one is needed:

| Permission | What It Does | Why QuickTab Needs It |
|------------|--------------|----------------------|
| `webNavigation` | Lets extensions detect when you navigate to a URL | Detects navigation to Zendesk ticket URLs so we can redirect to existing tabs |
| `tabs` | Lets extensions query and interact with browser tabs | Finds existing Zendesk agent tabs and focuses them instead of opening new ones |
| `storage` | Lets extensions save small amounts of data locally | Remembers your detection mode preference between browser sessions |
| `scripting` | Lets extensions run scripts on specific pages | Sends navigation messages to Zendesk's single-page app (avoids full page reloads) |
| `host_permissions` (zendesk.com) | Limits where the extension can operate | Ensures QuickTab only activates on Zendesk domains—not on other websites |

---

## Changes to This Policy

If we ever change this policy, we'll update it here. But honestly, our policy is "collect nothing"—there's not much to change.

---

## Questions?

If you have questions about this privacy policy or how QuickTab works, please [open an issue on GitHub](https://github.com/justcarlson/QuickTab/issues).

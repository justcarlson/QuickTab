# Chrome Web Store Listing Content

Copy-paste content for Chrome Web Store Developer Dashboard.

---

## Title

```
Zendesk Quicktab
```

---

## Summary (132 character max)

```
For Zendesk agents: stop tab chaos. Links open in your existing agent tab, not a new one. Fewer tabs, faster workflow.
```

*Character count: 117*

---

## Description

```
Stop tab chaos. QuickTab routes Zendesk links to your existing agent tab.

Built for Zendesk support agents who click ticket links all day—in emails, Slack, or internal tools.

Features:
- Links open in your existing agent tab, not a new one
- Reduces tab clutter dramatically
- Works with all Zendesk /agent URLs

How it works: Click any Zendesk ticket link anywhere. QuickTab finds your open agent tab and navigates there instead of opening a new tab. Your browser stays clean, your workflow stays fast.

Questions or ideas? Open an issue on GitHub:
https://github.com/justcarlson/QuickTab/issues
```

---

## Category

```
Productivity
```

---

## Language

```
English
```

---

## Privacy Policy URL

```
https://raw.githubusercontent.com/justcarlson/QuickTab/master/PRIVACY.md
```

---

## Support URL

```
https://github.com/justcarlson/QuickTab/issues
```

---

## Permission Justifications

Copy-paste these into the Chrome Web Store permission justification fields.

### webNavigation

```
Required to detect when the user navigates to a Zendesk ticket URL. This allows QuickTab to intercept the navigation and redirect to an existing agent tab instead of opening a new tab.
```

### tabs

```
Required to query existing browser tabs and find matching Zendesk agent tabs. When a Zendesk link is clicked, QuickTab uses this permission to locate an existing agent tab and focus it.
```

### storage

```
Required to save the user's URL detection preference between browser sessions. This setting controls which Zendesk URLs QuickTab intercepts. Data is stored locally and never transmitted.
```

### scripting

```
Required to send navigation messages to Zendesk's single-page application. This enables seamless in-page navigation without triggering full page reloads, providing a faster user experience.
```

### Host Permissions (*.zendesk.com)

```
QuickTab only operates on Zendesk domains. This narrow host permission scope ensures the extension cannot access any other websites. The extension monitors navigation to zendesk.com subdomains to redirect ticket links to existing agent tabs.
```

---

## Asset Checklist

- [ ] Extension Icon: 128x128px PNG (exists in package)
- [ ] Small Promotional Tile: 440x280px PNG/JPEG (create before submission)
- [ ] Screenshots: 1280x800px or 640x400px (user has annotated images)

---

*Document created for Phase 08 Plan 01*
*Privacy Policy: https://raw.githubusercontent.com/justcarlson/QuickTab/master/PRIVACY.md*

# Chrome Web Store Metadata

**Last updated:** 2026-01-25
**Status:** Ready for submission

## Store Description

### Short Description (132 char max)
Routes Zendesk links to existing agent tabs. No more tab clutter.

### Detailed Description

Tired of duplicate Zendesk tabs?

QuickTab keeps your workspace tidy. When you click a Zendesk /agent link from anywhere - Slack, email, docs - QuickTab routes it to your existing Zendesk tab instead of opening a new one.

**Features:**
- One focused Zendesk tab instead of tab clutter
- Works with links from any app or website
- Toggle on/off with one click
- Ticket-only mode for targeted routing
- Zero setup, zero accounts, zero data collection

**Privacy:**
QuickTab runs entirely in your browser. No data is sent anywhere. No analytics. No tracking. See our privacy policy for details.

**Open Source:**
QuickTab is open source. View the code at github.com/zendesklabs/QuickTab

## Screenshots

### Screenshot 1 (Required)
- File: app/images/screenshots/screen1.png
- Dimensions: 1280x800 (verified)
- Content: [Describe what the screenshot shows]
- Annotations needed: Yes - add callouts explaining features per CONTEXT.md

### Screenshot Notes
CONTEXT.md specifies annotated mockups with callouts. Current screen1.png may need:
- Callout pointing to mode toggle
- Arrow showing link-to-routing flow
- Before/after tab comparison if possible

## Category
- Primary: Productivity
- Secondary: n/a

## Privacy Fields

### Single Purpose Description
QuickTab routes Zendesk agent links to existing tabs instead of opening new ones, reducing tab clutter for Zendesk users.

### Permission Justifications

| Permission | Justification (for Chrome Web Store dashboard) |
|------------|-----------------------------------------------|
| webNavigation | Required to detect when you navigate to Zendesk URLs so we can route to existing tabs |
| tabs | Required to find existing Zendesk tabs and focus them when routing |
| storage | Required to save your detection mode preference between browser sessions |
| host_permissions | Required to only work on zendesk.com domains - we don't access other sites |

### Data Usage
- Does not collect user data
- Does not transmit data to external servers
- Does not use analytics
- Does not use cookies for tracking

### Privacy Policy URL
https://github.com/zendesklabs/QuickTab/blob/master/PRIVACY.md

## Verification Checklist

- [ ] PRIVACY.md exists and is accessible (test in incognito)
- [ ] Screenshot dimensions verified (1280x800)
- [ ] Description under 132 chars for short version
- [ ] All permission justifications written
- [ ] ZIP artifact builds correctly

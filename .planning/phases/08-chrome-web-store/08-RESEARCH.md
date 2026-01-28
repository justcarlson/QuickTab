# Phase 8: Chrome Web Store - Research

**Researched:** 2026-01-28
**Domain:** Chrome Web Store Submission and Publishing
**Confidence:** HIGH

## Summary

This research covers the Chrome Web Store submission process for QuickTab, a Manifest V3 Chrome extension targeting Zendesk agents. The submission process involves preparing store listing assets, writing permission justifications, ensuring the privacy policy meets Google's requirements, and navigating the review process.

QuickTab is well-positioned for approval: it uses narrowly-scoped host permissions (only zendesk.com domains), has a clear single purpose, and already has a comprehensive privacy policy. The main preparation work involves creating the required store listing assets (promotional image, screenshots) and writing clear permission justifications.

The review process typically completes within 24 hours for simple extensions, though factors like new developer accounts and host permissions can extend this to 1-3 days. Google provides a clear appeals process if rejection occurs.

**Primary recommendation:** Prepare permission justifications and small promotional image (440x280px) upfront, as these are the most common causes of submission delays.

## Standard Stack

This phase is primarily a process/submission phase rather than a coding phase. The "stack" consists of requirements and assets.

### Required Assets
| Asset | Dimensions | Format | Status |
|-------|------------|--------|--------|
| Extension Icon | 128x128px | PNG | READY (exists in public/images/icons/) |
| Small Promo Tile | 440x280px | PNG/JPEG | NEEDED |
| Screenshots | 1280x800px or 640x400px | PNG/JPEG | READY (user has annotated images) |
| Privacy Policy URL | N/A | URL | READY (PRIVACY.md in repo) |

### Required Listing Content
| Field | Max Length | Status |
|-------|------------|--------|
| Title | ~45 chars recommended | READY ("Zendesk Quicktab" in messages.json) |
| Summary | 132 characters | NEEDED |
| Description | No hard limit (be concise) | NEEDED |
| Category | Select from list | NEEDED |
| Language | Select | READY (en) |

### Developer Account Requirements
| Requirement | Status |
|-------------|--------|
| Google Account | READY (user confirmed) |
| $5 Registration Fee | READY (one-time, already paid) |
| 2-Step Verification | REQUIRED (verify before submission) |
| Email Verification | REQUIRED (verify before submission) |

## Architecture Patterns

### Store Listing Structure Pattern

**Effective description structure:**
1. Opening hook (1 sentence stating the core value proposition)
2. Target audience identification (for Zendesk agents)
3. Feature list (2-3 bullet points)
4. How it works (brief explanation)
5. Call-to-action for feedback

**Example structure:**
```
[Hook]: Stop tab chaos. QuickTab routes Zendesk links to your existing agent tab.

[Audience]: Built for Zendesk support agents who click ticket links all day.

[Features]:
- Links open in your existing tab, not a new one
- Reduces tab clutter dramatically
- Works with all /agent URLs

[How it works]: Click any Zendesk link in email, Slack, or anywhere else. QuickTab finds your open agent tab and navigates there instead.

[CTA]: Questions or ideas? Open an issue on GitHub.
```

### Permission Justification Pattern

**Structure for each permission:**
1. Permission name
2. What it enables (API access)
3. Why QuickTab needs it (specific use case)
4. What it does NOT do (address user concerns)

**QuickTab permission justifications:**

| Permission | Justification |
|------------|---------------|
| `webNavigation` | Required to detect when user navigates to a Zendesk ticket URL so we can redirect to existing agent tab instead of opening new tab |
| `tabs` | Required to query existing tabs and find matching Zendesk agent tabs, then focus/update them |
| `storage` | Required to save user's URL detection preference between browser sessions |
| `scripting` | Required to send navigation messages to Zendesk's single-page app to avoid full page reloads |
| `host_permissions (*.zendesk.com)` | Extension only operates on Zendesk domains - this narrow scope ensures we cannot access any other websites |

### Privacy Policy Hosting Pattern

Host at a stable URL that won't change. Options in order of preference:
1. **GitHub raw URL** (current): `https://raw.githubusercontent.com/justcarlson/QuickTab/master/PRIVACY.md`
2. **GitHub Pages**: If repo has Pages enabled
3. **GitHub blob URL**: `https://github.com/justcarlson/QuickTab/blob/master/PRIVACY.md`

**Note:** Google accepts GitHub URLs. No need for a separate website.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Privacy policy | Write from scratch | Use existing PRIVACY.md | Already well-structured, meets requirements |
| Permission justification format | Custom document | Developer Dashboard fields | Dashboard has specific fields for justifications |
| Screenshot annotations | Manual in image editor | Use existing annotated images | User confirmed these are ready |
| Store icon | Create new | Use existing 128x128 icon | Already exists at correct size |

**Key insight:** QuickTab already has most required assets. Focus on the gaps (promo tile, listing copy) rather than recreating existing work.

## Common Pitfalls

### Pitfall 1: Missing Small Promotional Image
**What goes wrong:** Submission rejected for missing 440x280px promotional image
**Why it happens:** Many developers assume screenshots alone are sufficient
**How to avoid:** Create promotional image BEFORE starting submission
**Warning signs:** Developer Dashboard shows red indicator on Store Listing tab

### Pitfall 2: Vague Permission Justification
**What goes wrong:** Review takes longer or gets rejected with "Purple Potassium" violation
**Why it happens:** Justifications say "needed for functionality" without specifics
**How to avoid:** Write specific justifications explaining exactly what each permission does and why it's necessary
**Warning signs:** Review takes more than 3 days

### Pitfall 3: Privacy Policy URL Inaccessible
**What goes wrong:** Rejection with "Purple Lithium" violation
**Why it happens:** URL requires authentication, returns 404, or redirects
**How to avoid:** Test the privacy policy URL in an incognito window before submission
**Warning signs:** Dashboard may show warning if URL is unreachable

### Pitfall 4: Description Keyword Stuffing
**What goes wrong:** Rejected for spam/manipulation
**Why it happens:** Trying to improve discoverability by repeating keywords
**How to avoid:** Write naturally, focus on clarity over SEO
**Warning signs:** Description reads unnaturally or repeats "Zendesk" excessively

### Pitfall 5: Excessive Permissions Not Used
**What goes wrong:** Rejected with "Purple Potassium" - extension requests permissions it doesn't use
**Why it happens:** Copy-pasting from templates or "future proofing"
**How to avoid:** Verify each permission is actually used in code
**Warning signs:** Review of manifest shows permissions that aren't called in any source file

**QuickTab status:** All declared permissions are used. `webNavigation` for navigation detection, `tabs` for tab queries, `storage` for preferences, `scripting` for SPA messaging. No unused permissions.

### Pitfall 6: Not Testing Packed Extension
**What goes wrong:** Extension works in development but fails after packaging
**Why it happens:** Build process differences, path issues, missing files
**How to avoid:** Test the actual .zip file by loading unpacked before submitting
**Warning signs:** Build warnings, missing files in .output directory

## Code Examples

### Chrome Developer Dashboard URLs

```
Dashboard: https://chrome.google.com/webstore/developer/dashboard
New Item Upload: https://chrome.google.com/webstore/developer/dashboard?action=new
```

### Privacy Policy URL Format

```
# For GitHub-hosted PRIVACY.md
Raw URL (preferred):
https://raw.githubusercontent.com/justcarlson/QuickTab/master/PRIVACY.md

# Alternative - GitHub blob view:
https://github.com/justcarlson/QuickTab/blob/master/PRIVACY.md
```

### Summary Field (132 char max)

```
For Zendesk agents: stop tab chaos. Links open in your existing agent tab, not a new one. Fewer tabs, faster workflow.
```
(Characters: 117)

### Category Selection

Based on extension functionality, appropriate categories:
- **Primary:** Productivity
- **Secondary consideration:** Business Tools (if available)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manifest V2 | Manifest V3 required | Jan 2024 | QuickTab already uses MV3 |
| No permission justification | Justification expected | 2023 | Must explain each permission |
| Any promo image | Specific 440x280 required | Long-standing | Must create exact size |
| Review 1-2 weeks | Review typically <24hrs | 2024 | Faster iteration on rejections |

**Current requirements:**
- 2-Step Verification mandatory for all developer accounts
- YouTube video link field now exists (optional)
- Marquee image (1400x560) is optional, not required

## Open Questions

1. **GitHub repo visibility**
   - What we know: Privacy policy links to GitHub repo
   - What's unclear: Is the repo currently public or private?
   - Recommendation: Ensure repo is public before submission so privacy policy and support URLs are accessible

2. **Contact email verification**
   - What we know: Context specifies info@brightera.io as contact
   - What's unclear: Is this email verified in the Google Developer account?
   - Recommendation: Verify email can receive correspondence from Google

3. **Category options**
   - What we know: "Productivity" is appropriate
   - What's unclear: Exact category list may have changed
   - Recommendation: Select during submission, have backup category ready

## Submission Checklist

Pre-submission verification (from official docs):

- [ ] Extension tested from the built .zip file
- [ ] 128x128 icon included in package
- [ ] 440x280 promotional image created
- [ ] At least 1 screenshot (1280x800 recommended), ideally 5
- [ ] Privacy policy URL accessible (test in incognito)
- [ ] Description written (no keyword stuffing)
- [ ] Summary written (under 132 chars)
- [ ] Permission justifications prepared
- [ ] 2-Step Verification enabled on developer account
- [ ] Developer email verified

## Sources

### Primary (HIGH confidence)
- [Chrome Web Store Publish Guide](https://developer.chrome.com/docs/webstore/publish) - Full submission process
- [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies/policies) - Policy requirements
- [Chrome Web Store Images Guide](https://developer.chrome.com/docs/webstore/images) - Image specifications
- [Chrome Web Store Review Process](https://developer.chrome.com/docs/webstore/review-process) - Review timeline and factors
- [Chrome Web Store Troubleshooting](https://developer.chrome.com/docs/webstore/troubleshooting) - Common violations and fixes
- [Chrome Web Store Best Listing](https://developer.chrome.com/docs/webstore/best-listing) - Listing best practices
- [Chrome Extension Permissions](https://developer.chrome.com/docs/extensions/reference/permissions-list) - Permission warnings
- [Declare Permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions) - Permission best practices

### Secondary (MEDIUM confidence)
- [Extension Radar - Why Extensions Get Rejected](https://www.extensionradar.com/blog/chrome-extension-rejected) - Community compilation of rejection reasons
- [Medium - Publishing First Extension](https://medium.com/womenintechnology/publish-your-first-chrome-extension-have-it-approved-the-1st-time-83a09becda3) - First-hand experience

## Metadata

**Confidence breakdown:**
- Submission requirements: HIGH - verified with official Chrome documentation
- Image specifications: HIGH - exact dimensions from official docs
- Review timeline: HIGH - official docs state <24hrs typical, <3 days for 90%
- Permission justifications: MEDIUM - best practices derived from troubleshooting docs
- Pitfalls: MEDIUM - combination of official troubleshooting and community reports

**Research date:** 2026-01-28
**Valid until:** 90 days (Chrome Web Store requirements are relatively stable)

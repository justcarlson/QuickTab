# Phase 5: Web Store Compliance - Research

**Researched:** 2026-01-25
**Domain:** Chrome Web Store Submission Compliance
**Confidence:** HIGH

## Summary

Phase 5 prepares the QuickTab extension for Chrome Web Store submission. This involves creating a privacy policy, auditing permissions, verifying build configuration for minification (not obfuscation), and updating store listing metadata.

Research confirms the extension is well-positioned for compliance. The WXT framework already produces minified (not obfuscated) output, source maps are generated correctly, and the existing screenshot meets Chrome Web Store dimension requirements. The primary work involves documentation (privacy policy, permission justifications) and minor configuration updates (ZIP naming convention).

**Key finding:** The `scripting` permission is declared but NOT USED in the modernized codebase. The CONTEXT.md indicates "Document existing permissions as-is (no removal audit)" but this unused permission could trigger review delays or rejection.

**Primary recommendation:** Create plain-language privacy policy emphasizing no data collection, document permission justifications for Chrome Web Store dashboard, configure ZIP artifact naming, and update store listing metadata.

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| WXT | 0.20.13 | Build & package extension | Already in use; handles minification, ZIP creation |
| Vite | (bundled) | Underlying bundler | WXT uses Vite; already configured with sourcemaps |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| ImageMagick/GIMP | Screenshot creation | Creating 1280x800 annotated screenshots |
| Markdown | Privacy policy format | PRIVACY.md in repository root |

### No Additional Dependencies Needed

This phase is primarily documentation and configuration. No new npm packages required.

## Architecture Patterns

### Chrome Web Store Dashboard Structure

The Chrome Web Store Developer Dashboard requires these privacy-related fields:

```
Privacy Practices Tab:
├── Single Purpose Description     # What the extension does
├── Permission Justifications      # Why each permission is needed
├── Remote Code Declaration       # Confirm no remote code (we have none)
├── Data Usage Certification      # Checkboxes for data collection
└── Privacy Policy URL            # Link to PRIVACY.md on GitHub
```

### Privacy Policy Structure (Per CONTEXT.md)

```markdown
# Privacy Policy for QuickTab

## The Short Version
We don't collect your data. Period.

## What Data QuickTab Accesses
[List what data is accessed locally, emphasize nothing leaves device]

## What Data QuickTab Stores
[Explain chrome.storage.local usage for settings]

## What Data QuickTab Shares
Nothing. QuickTab does not transmit any data.

## Permissions Explained
[User-friendly explanation of each permission]

## Contact
[GitHub issues link]
```

### Store Listing Description Structure (Per CONTEXT.md)

```
Problem-focused lead:
"Tired of duplicate Zendesk tabs? QuickTab keeps your workspace tidy."

Core behavior:
[How it works - simple explanation]

Features:
- [Feature 1]
- [Feature 2]
- [Feature 3]

Open source transparency:
"QuickTab is open source. View the code: [GitHub link]"
```

### Pattern: Permission Justification Format

For Chrome Web Store dashboard, each permission needs justification:

| Permission | Justification Pattern |
|------------|----------------------|
| `webNavigation` | "Required to detect when you navigate to Zendesk URLs so we can route to existing tabs" |
| `tabs` | "Required to find existing Zendesk tabs and focus them when routing" |
| `storage` | "Required to save your detection mode preference between browser sessions" |
| `host_permissions` | "Required to only work on zendesk.com domains - we don't access other sites" |

### Anti-Patterns to Avoid

- **Vague permission explanations:** Don't say "Required for extension to work" - explain the specific use
- **Legal jargon in privacy policy:** Keep it plain language per CONTEXT.md decision
- **Keyword stuffing in store description:** Focus on value, not SEO

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ZIP creation | Custom zip script | `wxt zip` command | WXT handles correct structure, compression |
| Minification | Custom build step | WXT/Vite default | Already minified, not obfuscated |
| Source maps | Manual configuration | `sourcemap: true` in vite config | Already configured in wxt.config.ts |
| Screenshot dimensions | Manual resize | Create at 1280x800 from start | Required dimension, avoid quality loss |

**Key insight:** WXT already handles all the build-related compliance requirements. The work is documentation and configuration.

## Common Pitfalls

### Pitfall 1: Unused Permissions Trigger Review Delays

**What goes wrong:** Declaring permissions that aren't used in code causes reviewers to question necessity, leading to delays or rejection.

**Why it happens:** Legacy code declared `scripting` permission for `chrome.scripting.executeScript()`, but modernized code removed this call. The permission stayed in manifest.

**Current state in QuickTab:**
- `scripting` permission IS DECLARED in wxt.config.ts
- `chrome.scripting` is NOT CALLED anywhere in `entrypoints/` or `src/`
- Only references are in legacy `app/` folder (not part of build)

**CONTEXT.md says:** "Audit approach: Document existing permissions as-is (no removal audit)"

**Recommendation:** Flag this finding for user decision. Documenting an unused permission creates inconsistency between code and justification. User should decide whether to:
1. Keep and justify anyway (risk review questions)
2. Remove unused permission (cleaner submission)

**How to avoid:** Always grep codebase for actual API usage before documenting permissions.

### Pitfall 2: Source Maps Included in User-Facing ZIP

**What goes wrong:** Source maps in the distribution ZIP expose source code structure to users, increase download size, and aren't needed for production.

**Why it happens:** WXT includes source maps in ZIP by default when `sourcemap: true` in vite config.

**Current state:** Source maps ARE being included in the ZIP (verified: `background.js.map`, `popup-*.js.map` in zip output).

**CONTEXT.md says:** "Source maps: Generate separately, upload to Web Store dashboard (not in ZIP)"

**How to avoid:** Configure WXT to exclude source maps from ZIP or build separately. Options:
1. Disable sourcemaps for production build
2. Use `zip.excludeSources` pattern to exclude `.map` files
3. Create custom script to strip maps from ZIP

**Warning signs:** ZIP contains `.map` files, ZIP size larger than expected.

### Pitfall 3: Store Screenshots Don't Show Extension In Action

**What goes wrong:** Screenshots that are just the popup or welcome screen don't demonstrate value to users browsing the store.

**Why it happens:** Developers screenshot their own UI rather than showing the problem being solved.

**CONTEXT.md says:** "Screenshots: Annotated mockups with callouts explaining features"

**How to avoid:** Create screenshots showing:
1. Before/after tab situation (multiple Zendesk tabs vs. single tab)
2. Popup with mode options annotated
3. Visual flow of link-click-to-routing behavior

**Warning signs:** Screenshots are just raw UI without annotations or context.

### Pitfall 4: Privacy Policy URL Not Publicly Accessible

**What goes wrong:** Privacy policy link submitted to Chrome Web Store returns 404 or requires login.

**Why it happens:** Link points to file in private repo, branch that doesn't exist, or uses raw.githubusercontent.com with wrong path.

**CONTEXT.md says:** "Location: PRIVACY.md in repository root, linked from store listing"

**How to avoid:**
- Ensure PRIVACY.md is committed to main branch before submission
- Use GitHub blob URL: `https://github.com/zendesklabs/QuickTab/blob/master/PRIVACY.md`
- Test the URL in incognito mode before submission

**Warning signs:** URL works when logged in but fails in incognito.

## Code Examples

### WXT ZIP Configuration with Custom Naming

```typescript
// wxt.config.ts
// Source: WXT documentation + verified in this project
import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    // ... existing manifest config
  },
  zip: {
    // Per CONTEXT.md: quicktab-v{version}.zip
    artifactTemplate: "quicktab-v{{version}}-{{browser}}.zip",
    // Exclude source maps from user-facing ZIP
    excludeSources: ["**/*.map"],
  },
  vite: (env) => ({
    build: {
      // Keep sourcemap for dev and for separate upload to Web Store
      sourcemap: env.mode === "production" ? "hidden" : true,
    },
  }),
});
```

### Permission Usage Verification

```bash
# Verify which Chrome APIs are actually used
grep -r "chrome\." entrypoints/ src/ --include="*.ts" | grep -v test | grep -v ".d.ts"

# Current actual usage (verified):
# - chrome.webNavigation.onBeforeNavigate
# - chrome.webNavigation.onCommitted
# - chrome.webNavigation.onDOMContentLoaded
# - chrome.tabs.create, .get, .update, .remove, .query
# - chrome.windows.update
# - chrome.storage.local.get, .set, .remove
# - chrome.runtime.onInstalled, .onMessage, .sendMessage, .getURL
# - chrome.action.setIcon, .enable
# - chrome.i18n.getMessage

# NOT USED:
# - chrome.scripting.* (no calls in entrypoints/ or src/)
```

### Privacy Policy Example Structure

```markdown
# Privacy Policy for QuickTab

**Effective date:** 2026-01-25
**Last updated:** 2026-01-25

## The Short Version

We don't collect your data. Period.

QuickTab runs entirely in your browser. No data is sent to any server. No analytics. No tracking. No accounts.

## What QuickTab Accesses

QuickTab watches for navigation to zendesk.com URLs. This happens locally in your browser to determine if a link should be routed to an existing tab.

## What QuickTab Stores

QuickTab stores one setting in your browser's local storage:
- Your detection mode preference (all links, ticket links only, or off)

This data never leaves your device.

## What QuickTab Does NOT Do

- Does not collect browsing history
- Does not read page content
- Does not track clicks or behavior
- Does not communicate with any external servers
- Does not run analytics or telemetry
- Does not require an account

## Permissions Explained

| Permission | Why We Need It |
|------------|----------------|
| Read your browsing history on zendesk.com | To detect Zendesk navigation and route to existing tabs |
| Access your tabs | To find existing Zendesk tabs and focus them |

## Changes to This Policy

We'll update this policy if our practices change. Check the "Last updated" date above.

## Questions?

Open an issue on GitHub: https://github.com/zendesklabs/QuickTab/issues
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Obfuscated code | Minified but readable | 2018 (Chrome policy) | Obfuscation causes rejection |
| Self-hosted privacy policy | In-repo Markdown | Standard practice | Simpler to maintain |
| Broad permissions | Minimal permissions | Ongoing Chrome focus | Reduces review friction |
| Embedded version in ZIP name | Template variables | WXT feature | Consistent naming |

**Deprecated/outdated:**
- Obfuscation tools like javascript-obfuscator: Will cause Chrome Web Store rejection
- Hosting privacy policy on separate domain: Adds complexity, can break

## Open Questions

### Question 1: Unused `scripting` Permission

**What we know:** The `scripting` permission is declared but `chrome.scripting` is not called in the modernized codebase. CONTEXT.md says "Document existing permissions as-is (no removal audit)."

**What's unclear:** Whether documenting a permission that isn't used will trigger review questions or rejection. There's tension between the locked decision and Chrome Web Store review expectations.

**Recommendation:** Flag for user decision before planning. Options:
1. Keep permission, justify with "reserved for future use" (risk: reviewer may push back)
2. Remove permission since it's unused (cleaner but deviates from CONTEXT.md decision)

### Question 2: Source Map Handling Strategy

**What we know:** WXT includes source maps in ZIP by default. CONTEXT.md says source maps should be uploaded separately to Web Store dashboard.

**What's unclear:** The exact mechanism for "uploading source maps to Web Store dashboard" - Chrome Web Store doesn't have a dedicated source map upload field. This may mean:
1. Keep source maps out of the main ZIP
2. Create a separate sources ZIP for reviewer access (WXT `--sources` flag)

**Recommendation:** Use WXT's `--sources` flag to create a separate sources ZIP. Keep main ZIP minimal for users, provide sources ZIP if requested during review.

### Question 3: Screenshot Content

**What we know:** Need annotated mockups showing features. Existing screenshot is correct dimensions (1280x800).

**What's unclear:** Whether existing screenshot content is sufficient or needs complete replacement with annotated version.

**Recommendation:** Evaluate existing `app/images/screenshots/screen1.png` during planning. If it shows the extension in action adequately, may only need annotations added.

## Sources

### Primary (HIGH confidence)

- [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies) - Official policy reference
- [Code Readability Requirements](https://developer.chrome.com/docs/webstore/program-policies/code-readability) - Minification vs obfuscation rules
- [Privacy Policies Requirements](https://developer.chrome.com/docs/webstore/program-policies/privacy) - What must be in privacy policy
- [Fill Out Privacy Fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/) - Dashboard field requirements
- [Supplying Images](https://developer.chrome.com/docs/webstore/images/) - Screenshot and icon dimensions
- [Creating Great Listings](https://developer.chrome.com/docs/webstore/best-listing) - Store listing best practices
- WXT CLI help output (`wxt zip --help`, `wxt build --help`) - Verified command options
- Local codebase grep for `chrome.scripting` - Verified API usage

### Secondary (MEDIUM confidence)

- [WXT InlineConfig Reference](https://wxt.dev/api/reference/wxt/interfaces/InlineConfig.html) - Configuration options for zip
- [Chrome Extensions Requirements for Privacy Policy](https://www.privacypolicies.com/blog/chrome-extensions-requirements-privacy-policy-secure-handling/) - Third-party summary

### Tertiary (LOW confidence)

- Community examples of wxt.config.ts with zip.artifactTemplate - Verified pattern but not official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing WXT, no new dependencies
- Privacy policy requirements: HIGH - Official Chrome documentation
- Permission justification format: HIGH - Official dashboard documentation
- Source map handling: MEDIUM - WXT docs + inferred from CONTEXT.md
- Screenshot requirements: HIGH - Official dimensions verified
- Unused permission finding: HIGH - Verified via grep, needs user decision

**Research date:** 2026-01-25
**Valid until:** 60 days (Chrome Web Store policies stable, update cycle ~quarterly)

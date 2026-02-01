# Phase 7: Version Sync - Research

**Researched:** 2026-01-27
**Domain:** Release-please versioning, npm package.json, GitHub releases
**Confidence:** HIGH

## Summary

This phase addresses a version mismatch between the project's source files and GitHub releases. The current state shows:
- **package.json:** `0.12.3`
- **.release-please-manifest.json:** `0.12.3`
- **GitHub release:** `v1.0` (Latest)
- **Git tag:** `v1.0` at commit `44cb8ad` (full SHA: `77d036884b51318b1d3443578d2fa2e99bffca3f`)

The v1.0 release was created manually (empty body, no changelog) as a milestone marker, but the version files were never updated. This causes release-please to be out of sync - it thinks the current version is 0.12.3 and will create releases starting from there rather than recognizing v1.0 exists.

The fix requires three coordinated changes:
1. Update `package.json` version to `1.0.1`
2. Update `.release-please-manifest.json` to `1.0.1`
3. Add `last-release-sha` to `release-please-config.json` pointing to the v1.0 tag commit

The `last-release-sha` option is critical - it tells release-please to only gather commits AFTER the v1.0 release when creating the next release PR. Without it, release-please would include all commits since 0.12.3 in the changelog.

**Primary recommendation:** Update version to 1.0.1 in package.json and manifest, configure `last-release-sha` to the v1.0 tag commit (`77d036884b51318b1d3443578d2fa2e99bffca3f`), then verify the next push creates a proper release PR for 1.0.1.

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| [release-please-action](https://github.com/googleapis/release-please-action) | v4 | Automated versioning and changelog | Already configured, Google-maintained |
| npm/package.json | - | Version source of truth for Node projects | Standard for Node release-type |
| .release-please-manifest.json | - | Tracks current release version | Required for manifest mode |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| WXT | 0.20.x | Uses package.json version for build artifacts | Automatic via `{{version}}` template |
| gh CLI | - | Verify releases and tags | Testing workflow |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual version sync | Release-As commit | Would create unnecessary release PR; direct edit is cleaner |
| Keeping v1.0 as-is | Deleting and recreating | Destructive; we want to preserve v1.0 milestone |

**No new dependencies required** - this is configuration-only.

## Architecture Patterns

### Version File Locations

```
QuickTab/
├── package.json                      # version: "1.0.1" (primary source)
├── .release-please-manifest.json     # ".": "1.0.1" (release-please tracking)
├── release-please-config.json        # last-release-sha: "77d03688..." (sync point)
└── wxt.config.ts                     # Uses {{version}} from package.json
```

### Pattern 1: Version Sync via last-release-sha

**What:** Tell release-please where the last release actually occurred
**When to use:** When manifest version doesn't match actual GitHub release
**Example:**

```json
// release-please-config.json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "node",
  "last-release-sha": "77d036884b51318b1d3443578d2fa2e99bffca3f",
  "include-v-in-tag": true,
  // ... rest of config
}
```

**Key point:** `last-release-sha` is NEVER ignored (unlike `bootstrap-sha`). Remove it after the first successful release PR is merged.

### Pattern 2: Coordinated Version Updates

**What:** Update all version-tracking files together
**When to use:** Always when manually syncing versions
**Files to update:**

1. `package.json` - `"version": "1.0.1"`
2. `.release-please-manifest.json` - `".": "1.0.1"`

**Do NOT update:**
- `CHANGELOG.md` - let release-please handle this
- Git tags - v1.0 stays, v1.0.1 created on next release

### Anti-Patterns to Avoid

- **Partial version updates:** Don't update package.json without updating the manifest - causes release-please confusion
- **Deleting the v1.0 tag:** Destructive, loses milestone marker
- **Using Release-As commit:** Creates unnecessary ceremony; direct file edits are cleaner for sync
- **Forgetting to remove last-release-sha:** Leave it too long and it blocks future changelog accumulation

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version parsing | regex on package.json | release-please node type | Handles semver edge cases |
| Changelog generation | manual CHANGELOG edit | release-please | Proper formatting, commit linking |
| Build artifact naming | hardcoded version | WXT `{{version}}` template | Single source of truth |
| Tag management | manual git tag | release-please | Consistent with release workflow |

**Key insight:** The version number appears in 4+ places (package.json, manifest, tags, zip filename). Keeping them in sync manually is error-prone; let tooling derive from package.json.

## Common Pitfalls

### Pitfall 1: Manifest Version Mismatch

**What goes wrong:** Release-please creates release PR for wrong version (e.g., 0.12.4 instead of 1.0.1)
**Why it happens:** Manifest still shows old version, release-please doesn't check GitHub releases
**How to avoid:** Update manifest to target version (1.0.1) before next push
**Warning signs:** Release PR title shows unexpected version number

### Pitfall 2: Forgetting last-release-sha

**What goes wrong:** Release PR changelog includes ALL commits since 0.12.3
**Why it happens:** Without last-release-sha, release-please starts from manifest version's last commit
**How to avoid:** Set last-release-sha to the v1.0 tag commit (`77d036884b51318b1d3443578d2fa2e99bffca3f`)
**Warning signs:** Massive changelog with commits already released in v1.0

### Pitfall 3: Leaving last-release-sha Forever

**What goes wrong:** Future releases don't include new commits
**Why it happens:** last-release-sha is never ignored - it always limits commit range
**How to avoid:** Remove last-release-sha from config after first successful 1.0.1 release
**Warning signs:** Empty or minimal changelog on subsequent releases

### Pitfall 4: CHANGELOG.md Format Break

**What goes wrong:** Existing CHANGELOG.md format differs from release-please output
**Why it happens:** Manual changelog uses different header format
**How to avoid:** Let release-please prepend its format; may need one-time cleanup
**Warning signs:** Inconsistent heading styles in CHANGELOG.md after release

### Pitfall 5: WXT Zip Filename Mismatch

**What goes wrong:** Build creates `quicktab-v0.12.3-chrome.zip` instead of `quicktab-v1.0.1-chrome.zip`
**Why it happens:** WXT reads version from package.json; if not updated, uses old version
**How to avoid:** Update package.json BEFORE building/zipping
**Warning signs:** Zip filename in .output/ shows wrong version

## Code Examples

### Updated package.json

```json
{
  "name": "QuickTab",
  "version": "1.0.1",
  "description": "Well behaved ticket tabs for Zendesk agents",
  // ... rest unchanged
}
```

### Updated .release-please-manifest.json

```json
{
  ".": "1.0.1"
}
```

### Updated release-please-config.json

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "node",
  "include-v-in-tag": true,
  "include-component-in-tag": false,
  "last-release-sha": "77d036884b51318b1d3443578d2fa2e99bffca3f",
  "pull-request-title-pattern": "chore: release ${version}",
  "changelog-sections": [
    { "type": "feat", "section": "Added" },
    { "type": "fix", "section": "Fixed" },
    { "type": "perf", "section": "Changed" },
    { "type": "refactor", "section": "Changed" },
    { "type": "deps", "section": "Dependencies" },
    { "type": "docs", "hidden": true },
    { "type": "chore", "hidden": true },
    { "type": "test", "hidden": true },
    { "type": "ci", "hidden": true },
    { "type": "build", "hidden": true }
  ],
  "packages": {
    ".": {
      "changelog-path": "CHANGELOG.md"
    }
  }
}
```

### Verification Commands

```bash
# Get full SHA for v1.0 tag
git rev-parse v1.0
# Output: 77d036884b51318b1d3443578d2fa2e99bffca3f

# Verify package.json version
jq -r .version package.json

# Verify manifest version
jq -r '."."' .release-please-manifest.json

# Build and check zip filename
pnpm build && pnpm zip
ls -la .output/*.zip

# Verify workflow will trigger
gh workflow view release-please.yml
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| bootstrap-sha only | last-release-sha for sync | Always available | bootstrap-sha ignored after first PR; last-release-sha never ignored |
| Manual changelog | release-please changelog-sections | Current standard | Automated, linked to commits |
| release-type in workflow | release-type in config file | v4 preference | Config file is source of truth |

**Deprecated/outdated:**
- `bootstrap-sha` for version sync: Only works on first run, then ignored
- Workflow-level configuration: Prefer config files for portability

## Open Questions

1. **CHANGELOG.md Header Cleanup**
   - What we know: Existing CHANGELOG.md uses `### v0.12.3 (date)` format
   - What's unclear: Whether release-please will match or conflict with this format
   - Recommendation: Accept potential one-time manual adjustment after first release

2. **Removing last-release-sha Timing**
   - What we know: Must be removed after successful release
   - What's unclear: Should it be removed in the release PR itself or separately?
   - Recommendation: Remove in a follow-up commit after v1.0.1 release PR merges

## Sources

### Primary (HIGH confidence)
- [googleapis/release-please manifest docs](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md) - last-release-sha documentation
- [googleapis/release-please-action](https://github.com/googleapis/release-please-action) - Action configuration
- [release-please config schema](https://github.com/googleapis/release-please/blob/main/schemas/config.json) - Complete configuration options
- Project files: package.json, wxt.config.ts, release-please-config.json

### Secondary (MEDIUM confidence)
- [Release-please v4 gotchas](https://danwakeem.medium.com/beware-the-release-please-v4-github-action-ee71ff9de151) - Documents v4 behavior
- [Initial version manifest issue](https://github.com/googleapis/release-please/issues/2397) - Version sync problems

### Tertiary (LOW confidence)
- None - all findings verified with official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing release-please setup
- Architecture: HIGH - Direct file updates, well-documented options
- Pitfalls: HIGH - Common issues documented in GitHub issues
- Code examples: HIGH - Derived from existing config and official docs

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (30 days - configuration changes are stable)

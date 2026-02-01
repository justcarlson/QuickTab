# Phase 6: CI/CD & Automation - Research

**Researched:** 2026-01-27
**Domain:** GitHub Actions, Release Automation, Conventional Commits
**Confidence:** HIGH

## Summary

This phase automates release workflows for a Chrome extension built with WXT. The existing CI workflow (`.github/workflows/ci.yml`) already handles lint, test, and build on PRs and pushes to main. The existing release workflow (`.github/workflows/release.yml`) triggers on tags but lacks version bumping, changelog generation, and CI verification before release.

The standard approach uses **release-please** from Google, which creates an accumulating "release PR" that updates version numbers and generates changelog from conventional commits. When merged, it creates the git tag. A separate workflow then builds and publishes artifacts on tag creation. This two-workflow pattern ensures CI runs on the release PR before any release is created.

The project already uses conventional commits (`fix:`, `feat:`, `docs:`, `chore:`, etc.) as verified in git history. WXT's zip configuration already uses the versioned naming pattern `quicktab-v{{version}}-{{browser}}.zip`. The existing CHANGELOG.md uses Keep a Changelog format but is manually maintained - this will be automated.

**Primary recommendation:** Use `googleapis/release-please-action@v4` with manifest configuration, mapping conventional commits to Keep a Changelog sections, and enhance the existing release workflow to run full CI before publishing.

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| [release-please-action](https://github.com/googleapis/release-please-action) | v4 | Creates release PRs, updates versions, generates changelog | Google-maintained, conventional commits native, 20k+ stars |
| [softprops/action-gh-release](https://github.com/softprops/action-gh-release) | v2 | Publishes GitHub releases with artifacts | Already in use, most popular release action |
| [actions/upload-artifact](https://github.com/actions/upload-artifact) | v4 | Stores build artifacts between jobs | Official GitHub action |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| [actions/checkout](https://github.com/actions/checkout) | v4 | Repository checkout | All workflows |
| [actions/setup-node](https://github.com/actions/setup-node) | v4 | Node.js environment | All workflows |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| release-please | semantic-release | semantic-release more complex, release-please simpler PR-based flow |
| release-please | changesets | changesets better for monorepos, overkill for single package |
| manual changelog | git-cliff | git-cliff more flexible but requires Rust, release-please integrates changelog natively |

**No new dependencies required** - release-please is a GitHub Action, not an npm package.

## Architecture Patterns

### Recommended Workflow Structure

```
.github/
  workflows/
    ci.yml              # Existing: PR/push checks (lint, test, build, e2e)
    release-please.yml  # NEW: Creates/updates release PR on push to main
    release.yml         # MODIFY: Build and publish on tag, run CI first
```

### Pattern 1: Two-Workflow Release Pattern

**What:** Separate workflows for release PR management and artifact publishing
**When to use:** Always - ensures CI runs before release
**Example:**

```yaml
# .github/workflows/release-please.yml
name: Release Please

on:
  push:
    branches:
      - master

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          release-type: node
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json
```

### Pattern 2: Tag-Triggered Release with CI Gate

**What:** Release workflow runs full CI before publishing artifacts
**When to use:** When tag is pushed (by release-please or manually)
**Example:**

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - "v*"

jobs:
  # Run CI first
  ci:
    uses: ./.github/workflows/ci.yml  # Reuse existing CI workflow

  # Only release if CI passes
  release:
    needs: ci
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run zip
      - uses: softprops/action-gh-release@v2
        with:
          files: .output/*.zip
          prerelease: ${{ contains(github.ref, '-') }}
```

### Pattern 3: Keep a Changelog Sections via release-please-config.json

**What:** Map conventional commit types to Keep a Changelog sections
**When to use:** Always - matches existing CHANGELOG.md format
**Example:**

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "node",
  "include-component-in-tag": false,
  "include-v-in-tag": true,
  "changelog-sections": [
    {"type": "feat", "section": "Added"},
    {"type": "fix", "section": "Fixed"},
    {"type": "perf", "section": "Changed"},
    {"type": "refactor", "section": "Changed"},
    {"type": "docs", "section": "Documentation", "hidden": true},
    {"type": "chore", "section": "Maintenance", "hidden": true},
    {"type": "test", "hidden": true},
    {"type": "ci", "hidden": true}
  ],
  "packages": {
    ".": {}
  }
}
```

### Anti-Patterns to Avoid

- **Single workflow for PR + release:** Don't combine release-please and artifact publishing in one workflow - prevents CI validation
- **Using GITHUB_TOKEN for release-please:** Workflows triggered by release-please won't run CI on the release PR (use PAT if CI on release PR is required, but not strictly necessary since CI runs on merge anyway)
- **Modifying version in commits:** Let release-please handle version bumps; manual version changes confuse the automation
- **Using `releases_created` output:** In v4, only use `release_created` (singular) - the plural form has a bug

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version bumping | Script parsing package.json | release-please | Handles semver rules, conventional commits analysis |
| Changelog generation | grep/sed on git log | release-please changelog-sections | Proper parsing, grouping, linking |
| Release PR management | Manual PR creation | release-please | Accumulates commits, updates on each push |
| Pre-release detection | Tag string parsing | `contains(github.ref, '-')` | GitHub's native expression handles semver pre-release |
| CI before release | Duplicating CI steps | `uses: ./.github/workflows/ci.yml` | Workflow reuse, single source of truth |

**Key insight:** Release automation has many edge cases (pre-releases, breaking changes, version conflicts). release-please handles these; custom scripts inevitably miss cases.

## Common Pitfalls

### Pitfall 1: GITHUB_TOKEN Doesn't Trigger Workflows

**What goes wrong:** Release PR is created but CI doesn't run on it; tags created by release-please don't trigger release workflow
**Why it happens:** GitHub prevents GITHUB_TOKEN from triggering new workflow runs to avoid infinite loops
**How to avoid:** For release workflow, trigger on tag push (not release event). For CI on release PR, either accept it runs on merge, or use a PAT with `repo` scope
**Warning signs:** Release PR shows no CI checks, or release workflow doesn't trigger after merge

### Pitfall 2: Existing CHANGELOG.md Format Mismatch

**What goes wrong:** release-please overwrites existing changelog with different format
**Why it happens:** Default changelog format differs from Keep a Changelog
**How to avoid:** Configure `changelog-sections` to match existing format; may need to manually adjust header format once
**Warning signs:** First release PR shows completely reformatted CHANGELOG.md

### Pitfall 3: Version Sync Issues

**What goes wrong:** package.json version doesn't match git tag
**Why it happens:** Manual version bumps, or release-please not finding previous release
**How to avoid:** Set correct initial version in `.release-please-manifest.json`, never manually edit version
**Warning signs:** release-please suggests wrong version number in PR

### Pitfall 4: Pre-release Tags Not Detected

**What goes wrong:** Beta releases (v1.0.0-beta.1) are published as stable
**Why it happens:** softprops/action-gh-release defaults to stable
**How to avoid:** Use `prerelease: ${{ contains(github.ref, '-') }}` - semver pre-releases always contain hyphen
**Warning signs:** GitHub shows beta version as "Latest Release"

### Pitfall 5: Workflow Reuse Permissions

**What goes wrong:** Called workflow fails with permission denied
**Why it happens:** Reusable workflows inherit caller's permissions by default
**How to avoid:** Ensure release workflow has same permissions as CI workflow, or explicitly declare in reusable workflow
**Warning signs:** "Resource not accessible by integration" errors

## Code Examples

### Complete release-please-config.json

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "node",
  "include-component-in-tag": false,
  "include-v-in-tag": true,
  "pull-request-title-pattern": "chore: release ${version}",
  "changelog-sections": [
    {"type": "feat", "section": "Added"},
    {"type": "fix", "section": "Fixed"},
    {"type": "perf", "section": "Changed"},
    {"type": "refactor", "section": "Changed"},
    {"type": "deps", "section": "Dependencies"},
    {"type": "docs", "hidden": true},
    {"type": "chore", "hidden": true},
    {"type": "test", "hidden": true},
    {"type": "ci", "hidden": true},
    {"type": "build", "hidden": true}
  ],
  "packages": {
    ".": {
      "changelog-path": "CHANGELOG.md"
    }
  }
}
```

### .release-please-manifest.json

```json
{
  ".": "0.12.3"
}
```

### release-please.yml Workflow

```yaml
name: Release Please

on:
  push:
    branches:
      - master

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    outputs:
      release_created: ${{ steps.release.outputs.release_created }}
      tag_name: ${{ steps.release.outputs.tag_name }}
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json
```

### Enhanced release.yml Workflow

```yaml
name: Release

on:
  push:
    tags:
      - "v*"

permissions:
  contents: write

jobs:
  # Run full CI before release
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage -- --run

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build

  # Release only after CI passes
  release:
    needs: [lint, test, build]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run zip

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: .output/*.zip
          prerelease: ${{ contains(github.ref, '-') }}
          generate_release_notes: false
```

### CLAUDE.md Additions for Commit Conventions

```markdown
## Commit Message Format

This project uses [Conventional Commits](https://conventionalcommits.org) for automated changelog generation.

### Format
\`\`\`
<type>(<scope>): <description>

[optional body]

[optional footer]
\`\`\`

### Types and Changelog Mapping
| Type | Changelog Section | Version Bump |
|------|-------------------|--------------|
| feat | Added | minor |
| fix | Fixed | patch |
| refactor | Changed | patch |
| perf | Changed | patch |
| feat! / fix! | (breaking) | major |

### Writing Changelog-Ready Commits
- **Description:** What changed (imperative mood)
- **Body:** Why it changed (context for future readers)
- **Breaking changes:** Use `!` suffix AND `BREAKING CHANGE:` footer

### Examples
\`\`\`
feat(routing): add support for ticket templates

Allow QuickTab to detect and route Zendesk ticket template URLs.
This enables users to configure routing for bulk ticket creation.

fix(storage): batch API calls to reduce latency

DLP extensions add latency to each chrome.* API call.
Batching reduces calls from O(N) to O(1) per navigation.

feat!: require Chrome 120+ for navigation API

BREAKING CHANGE: Drops support for Chrome versions below 120.
The new Navigation API provides better SPA detection.
\`\`\`
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| google-github-actions/release-please-action | googleapis/release-please-action | 2024 | Old repo archived, use new one |
| release-please v3 | release-please v4 | 2024 | Config file format changed, manifest mode preferred |
| `releases_created` output | `release_created` output | v4 | Bug in plural form, use singular |
| Manual changelog | Automated via changelog-sections | Current | Must configure sections for Keep a Changelog format |

**Deprecated/outdated:**
- `google-github-actions/release-please-action`: Archived, use `googleapis/release-please-action`
- release-please v3 workflow inputs: v4 prefers manifest files over workflow inputs
- `releases_created` output: Bug makes it unreliable, use `release_created`

## Open Questions

1. **Existing CHANGELOG.md Migration**
   - What we know: Existing changelog uses Keep a Changelog format but not exactly matching release-please output
   - What's unclear: Whether release-please will preserve existing entries or need manual adjustment
   - Recommendation: Test with dry-run first, may need one-time manual adjustment of header format

2. **PAT vs GITHUB_TOKEN**
   - What we know: GITHUB_TOKEN works for basic flow, PAT needed for CI on release PRs
   - What's unclear: Whether CI on release PRs is necessary (CI runs on merge anyway)
   - Recommendation: Start with GITHUB_TOKEN, add PAT only if CI on release PR is required

## Sources

### Primary (HIGH confidence)
- [googleapis/release-please-action](https://github.com/googleapis/release-please-action) - Official action documentation
- [googleapis/release-please](https://github.com/googleapis/release-please) - CLI and configuration reference
- [release-please config schema](https://github.com/googleapis/release-please/blob/main/schemas/config.json) - Complete configuration options
- [softprops/action-gh-release](https://github.com/softprops/action-gh-release) - Release action documentation
- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) - Changelog format specification
- [WXT Publishing Guide](https://wxt.dev/guide/essentials/publishing.html) - Extension publishing patterns

### Secondary (MEDIUM confidence)
- [Automating Releases with Release Please](https://deepak123s456.medium.com/automating-releases-with-github-actions-and-release-please-93a0aea20989) - Community tutorial verified against official docs
- [Release Please v4 Warning](https://danwakeem.medium.com/beware-the-release-please-v4-github-action-ee71ff9de151) - Documents v4 output bug

### Tertiary (LOW confidence)
- None - all findings verified with official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Google action with extensive documentation
- Architecture: HIGH - Two-workflow pattern well documented and widely used
- Pitfalls: HIGH - Documented in official docs and community posts
- Code examples: HIGH - Derived from official documentation and schema

**Research date:** 2026-01-27
**Valid until:** 2026-03-27 (60 days - release-please is stable, infrequent breaking changes)

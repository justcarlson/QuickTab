# Phase 6: CI/CD & Automation - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Automate release workflows — changelog generation, version bumping, and artifact publishing. CI workflow for PRs already exists from Phase 4. This phase adds release automation triggered by version PRs.

</domain>

<decisions>
## Implementation Decisions

### Release Triggering
- Git tags trigger release workflow (v* pattern)
- Pre-release tags (v1.0.0-beta.1) create GitHub pre-releases
- Stable tags (v1.0.0) create published releases
- Release workflow runs full CI (lint/test/build) before publishing

### Changelog Format
- Keep a Changelog format (Added, Changed, Fixed, Removed, etc.)
- Auto-generated from conventional commits during release workflow
- Commit type mapping: feat:→Added, fix:→Fixed, refactor:→Changed, docs:→skip
- Include commit scopes as prefix in entries (e.g., "**auth:** Add password reset")

### Version Strategy
- Conventional commit analysis determines bump: fix:→patch, feat:→minor, BREAKING CHANGE:→major
- Breaking changes indicated with `!` suffix AND `BREAKING CHANGE:` footer
- Version stored in both package.json and git tag (must stay synced)
- CI creates tag via release-please style version PR
- Single accumulating release PR — merging it triggers tag creation and release

### Artifact Handling
- Chrome extension ZIP only (quicktab-v{version}-chrome.zip)
- Releases published immediately (not draft)
- Release notes use changelog section for this version

### CLAUDE.md Updates (Phase 6 scope)
- Add commit message convention instructions
- Document breaking change format
- Ensure Claude writes changelog-ready commits

### Claude's Discretion
- Specific release-please configuration
- Changelog generation tooling choice
- Exact workflow file structure

</decisions>

<specifics>
## Specific Ideas

- "Commit messages should be changelog-ready" — body explains WHY, not WHAT
- Release-please pattern: accumulating PR that you merge when ready to release
- Research showed CLAUDE.md commit conventions are the key to good changelogs

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-cicd-automation*
*Context gathered: 2026-01-27*

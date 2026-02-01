# Claude Instructions

## Commit Message Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for changelog-ready commit messages.

Format: `<type>(<scope>): <description>`

## Types and Changelog Mapping

| Type     | Changelog Section | Version Bump | When to Use                           |
| -------- | ----------------- | ------------ | ------------------------------------- |
| feat     | Added             | minor        | New feature or functionality          |
| fix      | Fixed             | patch        | Bug fix                               |
| refactor | Changed           | patch        | Code restructuring without behavior change |
| perf     | Changed           | patch        | Performance improvement               |
| docs     | (none)            | (none)       | Documentation only                    |
| test     | (none)            | (none)       | Adding or updating tests              |
| chore    | (none)            | (none)       | Build process, dependencies           |
| style    | (none)            | (none)       | Formatting, whitespace                |
| feat!    | Breaking Changes  | major        | Breaking change (new feature)         |
| fix!     | Breaking Changes  | major        | Breaking change (bug fix)             |

## Writing Changelog-Ready Commits

**Description (first line):**
- Use imperative mood ("add feature" not "added feature")
- Keep under 72 characters
- Describe what changed

**Body (optional, after blank line):**
- Explain why the change was made
- Provide context for future readers
- Reference issues if applicable

**Breaking changes:**
- Use `!` suffix on type: `feat!:` or `fix!:`
- Include `BREAKING CHANGE:` footer with migration instructions

## Examples

Simple feature:
```
feat(popup): add dark mode toggle

Users requested the ability to match system theme preference.
Popup now respects prefers-color-scheme media query.
```

Bug fix with context:
```
fix(storage): handle chrome.storage quota exceeded error

When users had many tracked tabs, storage operations failed silently.
Now catches QuotaExceededError and removes oldest entries.
```

Breaking change:
```
feat!(api): change storage format to support multiple profiles

BREAKING CHANGE: Storage schema changed from flat to nested.
Existing data will be migrated automatically on first load.
Run migration: npm run migrate-storage
```

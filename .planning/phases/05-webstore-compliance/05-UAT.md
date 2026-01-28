---
status: resolved
phase: 05-webstore-compliance
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md]
started: 2026-01-27T00:00:00Z
updated: 2026-01-28T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Privacy Policy Exists
expected: PRIVACY.md exists at repository root with plain-language privacy policy explaining data handling and listing all permissions with explanations.
result: pass

### 2. Manifest Permissions Minimal
expected: Running `npm run build` and inspecting dist/chrome-mv3/manifest.json shows only 3 permissions: webNavigation, tabs, storage. No scripting permission.
result: skipped
reason: Test expectation outdated - scripting permission was re-added in v0.12.2/v0.12.3 for DLP extension compatibility fixes. Now uses chrome.scripting.executeScript for Zendesk SPA routing.

### 3. Production ZIP Excludes Source Maps
expected: Building with `npm run zip` produces a versioned ZIP file (quicktab-v{version}-chrome.zip). Listing contents with `unzip -l` shows no .map files.
result: pass

### 4. README Permissions Section
expected: README.md contains a Permissions section with a table explaining each permission (webNavigation, tabs, storage, host_permissions) in user-friendly language.
result: issue
reported: "this needs to be updated, but yes it is there. see scripting."
severity: minor

### 5. What We Don't Request Section
expected: README.md contains a "What We Don't Request" section listing permissions the extension intentionally avoids (history, browsing data, cookies, etc.).
result: issue
reported: "scripting does involve browser history, i believe"
severity: minor

### 6. Store Metadata Document
expected: STORE-METADATA.md exists in .planning/phases/05-webstore-compliance/ with Chrome Web Store listing content including description, permission justifications, and category.
result: pass

### 7. PR Created for Phase 5
expected: PR #5 exists on GitHub targeting master branch with Phase 5 commits (privacy policy, manifest cleanup, store metadata).
result: pass

## Summary

total: 7
passed: 4
issues: 2
pending: 0
skipped: 1

## Gaps

- truth: "README permissions table includes all current permissions"
  status: resolved
  reason: "User reported: this needs to be updated, but yes it is there. see scripting."
  severity: minor
  test: 4
  root_cause: "Scripting permission added in v0.12.2 post-Phase 5, docs not updated"
  fix: "Added scripting permission to README and PRIVACY.md tables"
  commit: "58a6d80"

- truth: "What We Don't Request section accurately reflects current permission scope"
  status: resolved
  reason: "User reported: scripting does involve browser history, i believe"
  severity: minor
  test: 5
  root_cause: "Statement 'No access to read page content' contradicted by scripting permission"
  fix: "Updated section to clarify scripting scope (zendesk.com only, navigation only)"
  commit: "58a6d80"

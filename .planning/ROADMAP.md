# Roadmap: QuickTab v1.0.1

**Milestone:** v1.0.1 Release & Publish
**Created:** 2026-01-27
**Phases:** 7-8 (continues from v1.0)

## Overview

| Phase | Name | Goal | Requirements |
|-------|------|------|--------------|
| 7 | Version Sync | Align versioning across package.json, releases, and artifacts | VER-01, VER-02, VER-03 |
| 8 | Chrome Web Store | Submit extension and get it published | CWS-01, CWS-02, CWS-03 |

**Total:** 2 phases | 6 requirements | 100% coverage

---

## Phase 7: Version Sync

**Goal:** Fix the version mismatch between package.json (0.12.3) and GitHub release (v1.0) by updating to 1.0.1

**Requirements:**
- VER-01: package.json version updated to 1.0.1
- VER-02: Release-please workflow correctly bumps version on merge
- VER-03: Build artifacts named with correct version (quicktab-v1.0.1-chrome.zip)

**Plans:** 1 plan

Plans:
- [ ] 07-01-PLAN.md — Sync version to 1.0.1 and verify build artifacts

**Success Criteria:**
1. package.json shows version "1.0.1"
2. `pnpm build` produces quicktab-v1.0.1-chrome.zip
3. Release-please manifest updated to track 1.0.1
4. CI passes with correct version in artifacts

**Dependencies:** None

---

## Phase 8: Chrome Web Store

**Goal:** Submit QuickTab to Chrome Web Store and get it published for public availability

**Requirements:**
- CWS-01: Extension submitted to Chrome Web Store
- CWS-02: Review feedback addressed (if any rejection/revision requests)
- CWS-03: Extension published and publicly available

**Success Criteria:**
1. Extension package uploaded to Chrome Web Store Developer Dashboard
2. Store listing complete (description, screenshots, privacy policy)
3. Extension passes Chrome Web Store review
4. Extension publicly installable from Chrome Web Store

**Dependencies:** Phase 7 (need correct versioned build)

---

## Requirement Traceability

| Requirement | Phase | Description |
|-------------|-------|-------------|
| VER-01 | 7 | package.json version updated to 1.0.1 |
| VER-02 | 7 | Release-please workflow correctly bumps version |
| VER-03 | 7 | Build artifacts named correctly |
| CWS-01 | 8 | Extension submitted to Chrome Web Store |
| CWS-02 | 8 | Review feedback addressed |
| CWS-03 | 8 | Extension published and publicly available |

**Coverage:** 6/6 requirements mapped (100%)

---
*Roadmap created: 2026-01-27*
*Phase 7 planned: 2026-01-27*

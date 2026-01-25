# Phase 1: Build Foundation - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish modern build infrastructure with WXT, TypeScript, and Biome before any code migration. No code migration happens in this phase — only tooling and project structure setup.

</domain>

<decisions>
## Implementation Decisions

### Project structure
- Follow WXT default conventions: `entrypoints/` folder with background.ts, popup/, etc.
- Shared utility code lives in `src/utils/` — e.g., src/utils/storage.ts, src/utils/url-matching.ts
- Static assets (icons, images) move to `public/` folder (WXT serves as static assets)
- i18n message files go to `public/_locales/en/messages.json` (Chrome extension standard location)

### Claude's Discretion
- TypeScript strict mode settings and compilation target
- Biome rules configuration and strictness
- Dev server output verbosity and error display
- Path alias configuration
- Pre-commit hook scope and behavior

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard WXT/TypeScript/Biome approaches for tooling configuration.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-build-foundation*
*Context gathered: 2026-01-25*

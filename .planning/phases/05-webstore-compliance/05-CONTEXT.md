# Phase 5: Web Store Compliance - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Prepare extension for Chrome Web Store submission. This includes privacy policy, permissions documentation, store listing metadata, and production build configuration. Automated release workflows belong in Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Privacy Policy Content
- Scope: Minimal — emphasize no data leaves the device, no analytics, no tracking
- Tone: Plain language, readable, not legal jargon ("We don't collect your data. Period.")
- Location: PRIVACY.md in repository root, linked from store listing
- Contact: Include GitHub issues link for user questions

### Store Listing
- Description style: Problem-focused — lead with pain point ("Tired of duplicate Zendesk tabs?")
- Screenshots: Annotated mockups with callouts explaining features
- Feature highlights: Core behavior only — tab reuse, mode toggle, keep it simple
- Open source: Prominently mention, include GitHub link in description

### Permissions Justification
- Detail level: User-friendly plain language explaining why each permission is needed
- Location: Both README section and Chrome Web Store listing
- Audit approach: Document existing permissions as-is (no removal audit)
- Non-permissions: Explicitly state what permissions are NOT requested for transparency

### Build Output
- Minification: Full minification (standard practice, compliant, optimizes load times)
- Source maps: Generate separately, upload to Web Store dashboard (not in ZIP)
- ZIP naming: quicktab-v{version}.zip (include version in filename)
- Output location: dist/ folder (standard WXT output)

### Claude's Discretion
- Exact wording of privacy policy sections
- Screenshot annotation design and layout
- Order of permission explanations
- Store description length and formatting

</decisions>

<specifics>
## Specific Ideas

- Privacy policy tone: "We don't collect your data. Period." — direct and confident
- Open source transparency via source maps uploaded separately for reviewer access
- Problem-focused listing leads with Zendesk tab duplication pain point

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-webstore-compliance*
*Context gathered: 2026-01-25*

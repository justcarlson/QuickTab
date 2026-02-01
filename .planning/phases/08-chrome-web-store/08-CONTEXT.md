# Phase 8: Chrome Web Store - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Submit QuickTab to Chrome Web Store and get it published for public availability. This includes store listing, screenshots, privacy policy, and addressing any review feedback.

</domain>

<decisions>
## Implementation Decisions

### Store Listing Content
- Professional/minimal tone — clean, factual, focuses on the problem solved
- Mention Zendesk explicitly — "For Zendesk agents" for clear targeting and discoverability
- 2-3 key benefits in feature list: core value (links open in existing tabs) + tab reduction + faster workflow
- Include feedback invitation CTA — encourage users to report issues or suggest features

### Visual Assets
- Annotated screenshots with callouts highlighting key features
- Workflow sequence — multiple screenshots showing the user journey
- Skip promotional images — only required screenshots, no promo tile
- User has annotated images already prepared

### Privacy Policy
- Host in GitHub repo as PRIVACY.md
- Minimal/plain language style — "We don't collect data. Everything stays on your device."
- Contact email: info@brightera.io
- Data stored (all local, never transmitted):
  - `urlDetection`: User's URL detection mode setting
  - `zendeskTabs`: Tab IDs mapped to subdomain and last activity timestamp

### Review Strategy
- Fix and resubmit immediately if CWS requests changes
- Prepare both permission justification and host permissions rationale upfront
- Support URL: GitHub issues page specifically
- Developer account: Already exists, ready to submit

### Claude's Discretion
- Exact wording of store description
- Structure of permission justification document
- Order of screenshots in workflow sequence

</decisions>

<specifics>
## Specific Ideas

- Store listing should feel professional and targeted at Zendesk support agents
- Privacy policy emphasizes no data collection, no external transmission

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-chrome-web-store*
*Context gathered: 2026-01-27*

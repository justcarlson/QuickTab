# Phase 3: UI Migration - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate popup and welcome page from jQuery/Handlebars to vanilla TypeScript. Users can view and toggle detection mode in the popup, and see a welcome page on first install. Zero jQuery or Handlebars dependencies remain after this phase.

</domain>

<decisions>
## Implementation Decisions

### Popup Interaction
- Instant toggle — mode changes apply immediately when clicked, no save button
- State change only — the toggle moving is sufficient feedback, no toast or checkmark
- Minimal display — just show the mode toggle, no tab count or extra info
- Silent fallback on storage errors — log error, keep last known state, no user-visible error

### Visual Styling
- Fresh minimal design — modern aesthetic, not preserving legacy look
- Dark mode follows system — detect OS preference via prefers-color-scheme
- iOS-style switch/slider for mode toggle
- Neutral/system colors — gray scale with system accent colors, no Zendesk branding

### Welcome Page Content
- Quick feature intro — brief explanation of what QuickTab does + how to use it
- Use existing hero illustration at app/images/pages/welcome/hero-v2.png (and .webp)
- Show "pin extension" tip as the call to action
- Same visual style as popup — consistent design language, colors, typography, dark mode

### i18n Approach
- Keep existing locales — migrate whatever _locales exist in current extension
- Chrome i18n API — use chrome.i18n.getMessage() at runtime
- Fall back to English for missing translations
- Allow locale override in settings — user can pick language in popup

### Claude's Discretion
- Exact spacing, typography, and component sizing
- Animation/transition details for toggle
- Welcome page layout and text copywriting
- Error logging implementation

</decisions>

<specifics>
## Specific Ideas

- Hero illustration already created: `app/images/pages/welcome/hero-v2.png` and `.webp`
- Popup should feel modern and minimal, not cluttered

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-ui-migration*
*Context gathered: 2026-01-25*

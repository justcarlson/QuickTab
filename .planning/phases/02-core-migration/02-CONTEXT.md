# Phase 2: Core Migration - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate service worker and URL matching logic to TypeScript with storage-first architecture. Extension intercepts Zendesk navigation and routes to existing agent tabs. Service worker survives termination via chrome.storage persistence.

</domain>

<decisions>
## Implementation Decisions

### URL Matching Behavior
- Ignore query parameters when matching URLs — `tickets/123?via=email` matches `tickets/123`
- Match any Zendesk subdomain — `company1.zendesk.com` and `company2.zendesk.com` both trigger routing
- Ignore hash fragments — same ticket regardless of `#reply` or other anchors
- Unified matching logic — same behavior for tickets, users, organizations; if pattern matches, route it

### State Persistence Strategy
- Persist tab tracking only — which tabs are Zendesk agent tabs (can rebuild from chrome.tabs if needed)
- Silent fallback to memory on storage failures — extension works but state won't survive restart, no user-visible error
- Local storage only — no cross-device sync via chrome.storage.sync
- Lazy cleanup of stale tabs — validate tab exists when routing, clean up if missing

### Tab Routing Logic
- Multiple matching tabs: use most recently active tab
- Different window: focus only — bring window to front, don't move tabs between windows
- Pinned tabs: same as regular tabs — can receive navigation
- Update URL when routing — navigate existing tab to exact new URL

### Service Worker Lifecycle
- No warm-up strategies — let Chrome manage lifecycle naturally, rely on storage for state
- Clean restart on extension update — reset state, re-detect Zendesk tabs on next navigation
- Console logs only for lifecycle events — DevTools debugging, no persistent logs
- Synchronous event listener registration only — all listeners at module scope per MV3 best practice

### Claude's Discretion
- Internal data structure for tab tracking
- Exact storage key naming
- Error recovery implementation details
- Console log format and verbosity

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for MV3 service worker patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-core-migration*
*Context gathered: 2026-01-25*

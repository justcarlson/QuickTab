# Pitfalls Research

**Domain:** Chrome Extension Modernization (MV3, TypeScript, Vite)
**Researched:** 2026-01-25
**Confidence:** HIGH (verified via official Chrome docs, community issue trackers, and multiple sources)

## Critical Pitfalls

### Pitfall 1: Service Worker State Loss on Termination

**What goes wrong:**
Global variables in the service worker are lost when Chrome terminates it. The service worker can terminate after 30 seconds of inactivity or 5 minutes of continuous activity. Any in-memory state (cached tab mappings, pending operations) vanishes without warning.

**Why it happens:**
Manifest V3 replaces persistent background pages with ephemeral service workers. Developers migrating from MV2 often carry over patterns that assume persistent state, such as storing subdomain-to-tab mappings in JavaScript variables.

**How to avoid:**
- Replace ALL global variables with `chrome.storage.session` (for session-only data) or `chrome.storage.local` (for persistent data)
- Use async/await with storage reads at the start of each event handler
- Never assume state exists from previous event handler executions
- Use `chrome.alarms` instead of `setTimeout`/`setInterval` for scheduled work

**Warning signs:**
- Code uses `let` or `const` at module scope to store runtime state
- Extension works in development (DevTools keeps worker alive) but fails in production
- Features work on first use but break after browser idle period

**Phase to address:**
Architecture/Foundation phase - must redesign state management before any feature work

---

### Pitfall 2: Synchronous Event Listener Registration Failure

**What goes wrong:**
Event listeners registered asynchronously (after awaiting something) may not fire when the service worker restarts. Chrome requires listeners to be registered synchronously during the first turn of the event loop.

**Why it happens:**
Developers often wrap initialization in async functions or delay listener registration until after fetching configuration. When the service worker restarts for an event, the listener isn't registered in time.

**How to avoid:**
- Register ALL event listeners at the top level of the service worker, synchronously
- Move configuration fetching INSIDE the event handlers, not before registration
- Never use top-level await before listener registration
- Pattern: Register listener first, then fetch config inside handler

**Warning signs:**
- Event handlers wrapped in `async function init() { ... }`
- Top-level `await` before `chrome.webNavigation.onCompleted.addListener()`
- Extension works after fresh install but stops responding after browser restart

**Phase to address:**
Architecture/Foundation phase - affects core event handling structure

---

### Pitfall 3: chrome.scripting.executeScript API Misuse

**What goes wrong:**
Migration from `chrome.tabs.executeScript` fails with cryptic errors. Common issues: wrong permission set, attempting to execute string code (not allowed in MV3), missing target specification, or trying to access DOM from service worker.

**Why it happens:**
MV3 moved `executeScript` to the `scripting` API with different syntax. The new API cannot execute arbitrary code strings - only files or functions. Developers also forget that service workers have no DOM access.

**How to avoid:**
- Add `"scripting"` permission AND `host_permissions` to manifest
- Use `chrome.scripting.executeScript({ target: { tabId }, func: ... })` syntax
- Never try to access `document` in service worker - use content scripts instead
- Pass data to injected functions via `args` parameter, not closure variables
- Place service worker file in extension root (not subdirectory)

**Warning signs:**
- Error: `chrome.tabs.executeScript is not a function`
- Error: `document is not defined` in service worker
- Error: `Cannot execute code string`
- Injection works on some sites but not others (missing host permissions)

**Phase to address:**
Core Migration phase - critical for the tab navigation feature

---

### Pitfall 4: Chrome Web Store Rejection - Excessive Permissions

**What goes wrong:**
Extension rejected with "Blue Argon" or similar rejection code indicating permission policy violation. Store review flags permissions that are declared but not demonstrably used, or permissions broader than necessary.

**Why it happens:**
Developers copy permissions from tutorials or request "just in case" permissions. The automated review flags discrepancies between declared permissions and actual API usage.

**How to avoid:**
- Request ONLY permissions actually used in code
- Remove `host_permissions` for domains not accessed
- Use `activeTab` instead of broad tab access where possible
- Document in store listing why each permission is needed
- Test with Chrome Web Store's extension analyzer before submission

**Warning signs:**
- Manifest has permissions like `"<all_urls>"` but only accesses one domain
- Permissions copied from boilerplate without review
- Store listing doesn't explain permission usage

**Phase to address:**
Pre-submission/QA phase - audit permissions against actual usage

---

### Pitfall 5: CRXJS/Vite Plugin Compatibility Breaking

**What goes wrong:**
Build suddenly fails after Vite upgrade, or development server works but production build is broken. CRXJS was in beta for 3+ years and has known compatibility issues with Vite 5+ and Chrome 130+.

**Why it happens:**
CRXJS is a lightweight plugin, not a full framework. It has peer dependency on older Vite versions and active maintenance has been intermittent (project sought new maintainers in 2025).

**How to avoid:**
- Consider WXT framework instead of CRXJS for new projects (more comprehensive, actively maintained)
- If using CRXJS, pin specific versions of both CRXJS and Vite
- Test production builds frequently, not just development mode
- Watch CRXJS GitHub for breaking changes before upgrading Vite

**Warning signs:**
- Warning: `unmet peer vite@^2.9.0` during install
- Dev server shows "Cannot connect to Vite Dev Server" in production build
- `build.rollupOptions.input` works in `vite build` but breaks `vite dev`

**Phase to address:**
Build Tooling phase - choose framework carefully at start

---

### Pitfall 6: jQuery to Vanilla JS - Silent Failures

**What goes wrong:**
Migrated code appears to work but fails silently on edge cases. `querySelector` returns null (instead of empty jQuery object), event handlers don't attach to dynamic elements, and NodeList requires explicit iteration.

**Why it happens:**
jQuery's API is forgiving - methods on empty selections are no-ops. Vanilla JS throws or fails silently when operating on null. jQuery's `.on()` delegation is significantly more powerful than vanilla event listeners.

**How to avoid:**
- Add null checks after every `querySelector` call
- Use event delegation manually: attach to parent, check `event.target`
- Use `querySelectorAll` + `forEach` instead of jQuery selection chains
- Consider a tiny utility for common patterns rather than rewriting everything

**Warning signs:**
- `TypeError: Cannot read property 'addEventListener' of null`
- Event handlers work on page load but not on dynamically added elements
- Code works in popup but fails in content scripts with different DOM timing

**Phase to address:**
UI Migration phase - requires systematic replacement with testing

---

### Pitfall 7: TypeScript Chrome Types Mismatch

**What goes wrong:**
TypeScript compiles but runtime errors occur because `@types/chrome` doesn't match actual Chrome API behavior. Promise-based APIs may be typed as callback-only, or vice versa.

**Why it happens:**
Chrome APIs evolve faster than DefinitelyTyped updates. MV3 introduced promise support for many APIs, but type definitions lag. Some APIs have subtle differences between Chrome and Firefox that types don't capture.

**How to avoid:**
- Always check Chrome official docs, not just TypeScript types
- Test actual runtime behavior, not just type checking
- Pin `@types/chrome` version and update deliberately with testing
- Use runtime checks for API availability before calling

**Warning signs:**
- Code compiles but `chrome.*.promise is not a function`
- TypeScript shows method exists but runtime says undefined
- Type definitions show callback signature but docs show promise support

**Phase to address:**
TypeScript Migration phase - validate types against runtime behavior

---

### Pitfall 8: Vite Base Path and Asset Resolution

**What goes wrong:**
Extension loads in development but fails in production. Assets (images, CSS) return 404. Scripts fail to load with wrong paths.

**Why it happens:**
Vite defaults to absolute paths (`/assets/...`) but Chrome extensions need relative paths (`./assets/...`). The extension context doesn't have a web server to resolve absolute paths.

**How to avoid:**
- Set `base: './'` in vite.config.ts
- Configure rollup output: `entryFileNames: '[name].js'` (remove hash)
- Use `import.meta.url` or `chrome.runtime.getURL()` for asset paths
- Verify build output paths before packaging

**Warning signs:**
- Works in `vite dev` but not after `vite build`
- Browser console shows 404 for extension assets
- Paths in built files start with `/` instead of `./`

**Phase to address:**
Build Tooling phase - configure correctly from the start

---

### Pitfall 9: CSP Conflicts with Development Tooling

**What goes wrong:**
Vite HMR doesn't work in extension context. Console shows CSP violations for inline scripts or eval. Extension works in development but security policy breaks features.

**Why it happens:**
MV3 enforces strict CSP that prohibits `unsafe-eval` and `unsafe-inline`. Vite's HMR relies on both for hot reloading. Chrome 130+ introduced stricter CSP enforcement.

**How to avoid:**
- Accept that HMR won't work fully in extension context during dev
- Use manual reload workflow or extension reload plugins
- Keep development CSP permissive, production CSP strict
- Consider separate dev/prod manifest files

**Warning signs:**
- Console: `Refused to execute inline script because it violates CSP`
- HMR connection established but updates don't apply
- Works in Chrome 129 but breaks in Chrome 130+

**Phase to address:**
Build Tooling phase - understand limitations upfront

---

### Pitfall 10: webNavigation Back/Forward Cache Duplicate Events

**What goes wrong:**
Extension applies changes multiple times to the same page. Users see duplicate effects (double styling, multiple message sends). State becomes inconsistent.

**Why it happens:**
When a page is restored from Back/Forward Cache, `onBeforeNavigate`, `onCommitted`, and `onCompleted` fire again but NOT `onDOMContentLoaded`. Extensions that don't track document lifecycle apply operations repeatedly.

**How to avoid:**
- Use `documentId` (Chrome 106+) to track unique documents, not just `frameId`
- Implement deduplication: track processed documentIds in session storage
- Check `transitionType` to identify bfcache restores
- Clear tracked documentIds periodically to prevent memory growth

**Warning signs:**
- Effects stack on back/forward navigation
- Console shows duplicate log entries for same page
- State behaves differently on fresh navigation vs. back button

**Phase to address:**
Core Migration phase - affects webNavigation event handling

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip TypeScript strict mode | Faster initial migration | Type errors leak to runtime | Never - strict mode is the point of TypeScript |
| Use `any` for Chrome APIs | Unblock compilation | Lose type safety for critical APIs | Only temporarily during migration, with TODO comments |
| Bundle jQuery "just in case" | Faster migration | 30KB+ bundle size, blocks MV3 compliance | Never - complete migration or don't start |
| Skip service worker termination tests | Tests pass in dev | Production failures after idle | Never - this is the #1 MV3 migration failure |
| Copy CSP from example | Build works | Security vulnerabilities, store rejection | Never - understand and configure intentionally |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Zendesk URLs | Hardcoding subdomain patterns | Use URL parsing, validate against zendesk.com domain |
| chrome.storage | Assuming sync read | Always await/callback, handle undefined values |
| chrome.tabs | Assuming tab exists | Check for undefined, handle tab closed during operation |
| chrome.webNavigation | Processing all frame events | Filter `frameId === 0` for main frame only |
| postMessage | Using `'*'` origin | Specify exact origin, validate message source |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sync storage read per event | Slow initial response | Cache in memory, refresh on change | >10 events/second |
| tabs.query() on every navigation | UI lag, battery drain | Debounce queries, cache results | Rapid tab switching |
| Large content script bundles | Slow page load on target sites | Code split, lazy load non-critical | Bundle >100KB |
| Unbounded session storage | Memory growth, eventual crash | Implement LRU eviction, size limits | >1000 tracked documents |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `postMessage` with wildcard origin | Data leakage to malicious frames | Use specific origin, validate sender |
| Template literals with user data | XSS in popup/options page | Sanitize all interpolated values |
| Storing secrets in chrome.storage | Secrets visible via DevTools | Use session storage, minimize secrets |
| Overly broad host_permissions | Access to unintended sites | Limit to exact domains needed |
| Content script on all URLs | Performance impact, attack surface | Use specific URL patterns |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Silent failures | Users don't know extension is broken | Add visual feedback, error states |
| No onboarding | Users don't understand features | Show welcome page on install |
| Permission prompts without context | Users deny permissions | Explain why needed before requesting |
| No keyboard shortcuts | Slow for power users | Add command shortcuts in manifest |
| Inconsistent icon states | Confusion about enabled/disabled | Clear visual states for all modes |

## "Looks Done But Isn't" Checklist

- [ ] **Service worker events:** Often missing termination testing - verify handlers work after 30-second idle
- [ ] **Storage migration:** Often missing v0.11.x to new format migration - verify old data loads correctly
- [ ] **Error handling:** Often missing chrome.runtime.lastError checks - verify all async calls check for errors
- [ ] **Manifest permissions:** Often missing used permissions - verify extension works with only declared permissions
- [ ] **Content scripts:** Often missing all_frames handling - verify behavior in iframes
- [ ] **Build output:** Often missing production path testing - verify extension loads from built artifacts
- [ ] **Store assets:** Often missing screenshots/descriptions - verify all required metadata present

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Service worker state loss | MEDIUM | Audit all global variables, migrate to storage, add termination tests |
| Wrong executeScript API | LOW | Update syntax, add scripting permission, test on target sites |
| CRXJS compatibility | HIGH | Consider framework switch (WXT), or pin versions and accept limitations |
| Store rejection | MEDIUM | Read rejection email carefully, address specific violation, resubmit |
| jQuery migration bugs | MEDIUM | Add comprehensive DOM interaction tests, fix null reference errors |
| CSP violations | MEDIUM | Separate dev/prod configs, accept HMR limitations |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Service worker state loss | Architecture | Termination tests pass |
| Event listener registration | Architecture | Events fire after browser restart |
| executeScript API | Core Migration | Script injection works on Zendesk |
| Store rejection (permissions) | QA/Pre-submission | Permissions match actual usage |
| CRXJS/Vite compatibility | Build Tooling | Production build loads correctly |
| jQuery migration | UI Migration | All popup interactions work |
| TypeScript types | TypeScript Migration | No runtime type errors |
| Vite base path | Build Tooling | Assets load in production |
| CSP/HMR conflicts | Build Tooling | Dev workflow documented |
| webNavigation bfcache | Core Migration | No duplicate operations on back nav |

## Sources

### Official Documentation (HIGH confidence)
- [Chrome Manifest V3 Migration Checklist](https://developer.chrome.com/docs/extensions/develop/migrate/checklist)
- [Service Worker Lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [Migrate to Service Workers](https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers)
- [chrome.scripting API](https://developer.chrome.com/docs/extensions/reference/api/scripting)
- [chrome.webNavigation API](https://developer.chrome.com/docs/extensions/reference/api/webNavigation)
- [Chrome Web Store Troubleshooting](https://developer.chrome.com/docs/webstore/troubleshooting)
- [Content Security Policy for Extensions](https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy)
- [Longer Service Worker Lifetimes](https://developer.chrome.com/blog/longer-esw-lifetimes)

### Community & Issue Trackers (MEDIUM confidence)
- [CRXJS Maintenance Status Discussion](https://github.com/crxjs/chrome-extension-tools/discussions/872)
- [CRXJS CSP Issue on Chrome 130+](https://github.com/crxjs/chrome-extension-tools/issues/918)
- [Vite Strict CSP Issue](https://github.com/vitejs/vite/issues/11862)
- [Extension Radar: Chrome Extension Rejection Reasons](https://www.extensionradar.com/blog/chrome-extension-rejected)
- [eyeo's Journey Testing Service Worker Suspension](https://developer.chrome.com/blog/eyeos-journey-to-testing-mv3-service%20worker-suspension)

### Comparative Analysis (MEDIUM confidence)
- [2025 State of Browser Extension Frameworks](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/)
- [Playwright Chrome Extension Testing](https://playwright.dev/docs/chrome-extensions)

### Migration Guides (MEDIUM confidence)
- [jQuery to Vanilla JS Cheat Sheet](https://tobiasahlin.com/blog/move-from-jquery-to-vanilla-javascript/)
- [CSS-Tricks: Transition to Manifest V3](https://css-tricks.com/how-to-transition-to-manifest-v3-for-chrome-extensions/)

---
*Pitfalls research for: Chrome Extension Modernization (QuickTab)*
*Researched: 2026-01-25*

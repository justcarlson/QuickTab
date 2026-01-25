# Architecture Research

**Domain:** Chrome Extension (TypeScript + Vite + Manifest V3)
**Researched:** 2026-01-25
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Chrome Extension                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   Popup UI      │  │   Welcome Page  │  │   Options UI    │         │
│  │   (popup/)      │  │   (welcome/)    │  │   (options/)    │         │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘         │
│           │                    │                    │                   │
│           └────────────────────┼────────────────────┘                   │
│                                │                                        │
│                     ┌──────────┴──────────┐                             │
│                     │  Chrome Messaging   │                             │
│                     │  (chrome.runtime)   │                             │
│                     └──────────┬──────────┘                             │
│                                │                                        │
├────────────────────────────────┼────────────────────────────────────────┤
│                     ┌──────────┴──────────┐                             │
│                     │  Service Worker     │                             │
│                     │  (background.ts)    │                             │
│                     │                     │                             │
│                     │  - Event listeners  │                             │
│                     │  - Tab management   │                             │
│                     │  - URL routing      │                             │
│                     └──────────┬──────────┘                             │
│                                │                                        │
├────────────────────────────────┼────────────────────────────────────────┤
│                     ┌──────────┴──────────┐                             │
│                     │  Chrome APIs        │                             │
│                     │                     │                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ storage │  │  tabs   │  │webNav   │  │scripting│  │ action  │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Service Worker (background.ts) | Event handling, tab management, URL routing | Single entry point, event-driven, no persistent state in memory |
| Popup UI | Settings display, user preferences toggle | HTML + vanilla TS, reads/writes chrome.storage |
| Welcome Page | Onboarding on first install | Static HTML with minimal JS |
| Shared Modules | URL matching, storage abstraction, types | Pure TypeScript modules imported by all contexts |
| Chrome API Wrappers | Type-safe API access, promise-based | Thin abstraction layer over chrome.* APIs |

## Recommended Project Structure

### WXT Framework Structure (Recommended)

WXT is the recommended framework for this modernization. It provides automatic manifest generation, HMR, and TypeScript-first development.

```
quicktab/
├── .output/                    # Build artifacts (git-ignored)
├── .wxt/                       # WXT generated types/config (git-ignored)
├── src/
│   ├── entrypoints/            # All extension entry points
│   │   ├── background.ts       # Service worker
│   │   ├── popup/              # Popup UI
│   │   │   ├── index.html
│   │   │   ├── main.ts
│   │   │   └── style.css
│   │   └── welcome/            # Welcome page
│   │       ├── index.html
│   │       ├── main.ts
│   │       └── style.css
│   ├── utils/                  # Auto-imported utilities
│   │   ├── url-match.ts        # URL pattern matching
│   │   ├── storage.ts          # Chrome storage wrapper
│   │   └── constants.ts        # Shared constants
│   ├── types/                  # TypeScript type definitions
│   │   ├── index.ts
│   │   └── zendesk.ts          # Domain-specific types
│   └── assets/                 # Processed assets (CSS, images)
│       └── icons/
├── public/                     # Static files copied as-is
│   └── _locales/               # i18n message files
│       └── en/
│           └── messages.json
├── tests/                      # Test files
│   ├── unit/                   # Vitest unit tests
│   │   ├── url-match.test.ts
│   │   └── storage.test.ts
│   └── e2e/                    # Playwright E2E tests
│       └── navigation.spec.ts
├── wxt.config.ts               # WXT configuration
├── vitest.config.ts            # Vitest configuration
├── playwright.config.ts        # Playwright configuration
├── tsconfig.json               # TypeScript configuration
└── package.json
```

### Alternative: Manual Vite Structure (If WXT Not Used)

```
quicktab/
├── dist/                       # Build output (git-ignored)
├── src/
│   ├── background/
│   │   └── index.ts            # Service worker entry
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── style.css
│   ├── welcome/
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── style.css
│   ├── shared/                 # Shared code
│   │   ├── api/                # Chrome API wrappers
│   │   │   ├── storage.ts
│   │   │   ├── tabs.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── url-match.ts
│   │   └── types/
│   │       └── index.ts
│   └── manifest.json           # Extension manifest
├── public/
│   ├── icons/
│   └── _locales/
├── tests/
│   ├── unit/
│   └── e2e/
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

### Structure Rationale

- **`src/entrypoints/`**: WXT convention. Each file/directory becomes a bundle entry. File naming determines manifest output.
- **`src/utils/`**: Auto-imported by WXT. Pure functions with no side effects. Shared across all contexts.
- **`src/types/`**: Centralized TypeScript definitions. Imported explicitly where needed.
- **`tests/`**: Separated from source for cleaner builds. Split unit/e2e for different runners.
- **`public/`**: Static assets (i18n, icons) copied without transformation.

## Architectural Patterns

### Pattern 1: Event-Driven Service Worker

**What:** Service worker listens to Chrome events and responds. No persistent state in memory.
**When to use:** All background processing in Manifest V3.
**Trade-offs:**
- Pros: Low memory footprint, Chrome can suspend when idle
- Cons: Must reload state from storage on each wake

**Example (WXT):**
```typescript
// src/entrypoints/background.ts
export default defineBackground(() => {
  // State must be loaded from storage, not held in variables

  chrome.webNavigation.onBeforeNavigate.addListener(
    async (details) => {
      const settings = await storage.get('urlDetection');
      if (shouldIntercept(details.url, settings)) {
        await routeToExistingTab(details);
      }
    },
    { url: [{ hostSuffix: 'zendesk.com' }] }
  );

  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
      await chrome.tabs.create({
        url: browser.runtime.getURL('/welcome.html')
      });
    }
  });
});
```

### Pattern 2: Storage as Single Source of Truth

**What:** All persistent state lives in chrome.storage. Service worker and UI read/write there.
**When to use:** Any data that must survive service worker restarts.
**Trade-offs:**
- Pros: Survives restarts, shared across contexts, built-in sync
- Cons: Async access, small size limits (5MB local, 100KB sync)

**Example:**
```typescript
// src/utils/storage.ts
import { storage } from 'wxt/storage';

// Define typed storage items
export const urlDetectionMode = storage.defineItem<'allUrls' | 'ticketUrls' | 'noUrls'>(
  'local:urlDetection',
  { fallback: 'allUrls' }
);

// Usage in any context
const mode = await urlDetectionMode.getValue();
await urlDetectionMode.setValue('ticketUrls');

// Watch for changes
urlDetectionMode.watch((newValue) => {
  updateIcon(newValue);
});
```

### Pattern 3: Message Passing for Cross-Context Communication

**What:** Use chrome.runtime.sendMessage for popup-to-background communication.
**When to use:** When UI needs to trigger background actions or get computed state.
**Trade-offs:**
- Pros: Clean separation, async by design
- Cons: Serialization overhead, error handling complexity

**Example:**
```typescript
// src/utils/messaging.ts
interface Messages {
  getStatus: { request: void; response: { enabled: boolean; tabCount: number } };
  toggleEnabled: { request: boolean; response: void };
}

// Background handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getStatus') {
    getStatus().then(sendResponse);
    return true; // Keep channel open for async response
  }
});

// Popup caller
const status = await chrome.runtime.sendMessage({ type: 'getStatus' });
```

### Pattern 4: URL Pattern Matching Module

**What:** Pure functions for URL classification. No side effects, fully testable.
**When to use:** URL routing logic that needs high test coverage.
**Trade-offs:**
- Pros: Easy to test, predictable, reusable
- Cons: Must be careful about regex performance

**Example:**
```typescript
// src/utils/url-match.ts
export interface RouteMatch {
  subdomain: string;
  path: string;
  isTicket: boolean;
}

const LOTUS_ROUTE = /^https?:\/\/([^.]+)\.zendesk\.com\/agent\/(?!chat|voice)#?\/?(.*)$/;
const TICKET_ROUTE = /^https?:\/\/([^.]+)\.zendesk\.com\/(?:agent\/tickets|tickets)\/?(.*)$/;
const RESTRICTED_ROUTE = /^https?:\/\/[^.]+\.zendesk\.com\/agent\/(chat|talk|admin)/;

export function matchUrl(url: string, mode: DetectionMode): RouteMatch | null {
  if (mode === 'noUrls') return null;
  if (RESTRICTED_ROUTE.test(url)) return null;

  const ticketMatch = url.match(TICKET_ROUTE);
  if (ticketMatch) {
    return { subdomain: ticketMatch[1], path: `/tickets/${ticketMatch[2]}`, isTicket: true };
  }

  if (mode === 'allUrls') {
    const lotusMatch = url.match(LOTUS_ROUTE);
    if (lotusMatch) {
      return { subdomain: lotusMatch[1], path: `/${lotusMatch[2]}`, isTicket: false };
    }
  }

  return null;
}
```

## Data Flow

### Navigation Interception Flow

```
[User clicks Zendesk link]
         │
         ▼
[Chrome fires webNavigation.onBeforeNavigate]
         │
         ▼
[Service Worker receives event]
         │
         ▼
[Load detection mode from storage]
         │
         ▼
[Match URL against patterns]
         │
         ├── No match ──▶ [Allow normal navigation]
         │
         ▼
[Query existing Zendesk tabs]
         │
         ├── No existing tab ──▶ [Allow normal navigation]
         │
         ▼
[Execute script to update existing tab's route]
         │
         ▼
[Focus existing tab]
         │
         ▼
[Close original tab]
```

### Settings Update Flow

```
[User toggles setting in popup]
         │
         ▼
[Write to chrome.storage.local]
         │
         ▼
[storage.onChanged fires in service worker]
         │
         ▼
[Update action icon state]
```

## Build Output Structure

### WXT Build Output

```
.output/
├── chrome-mv3/                 # Production Chrome build
│   ├── manifest.json           # Generated from entrypoints + wxt.config.ts
│   ├── background.js           # Bundled service worker
│   ├── popup.html
│   ├── popup.js
│   ├── welcome.html
│   ├── welcome.js
│   ├── chunks/                 # Shared code chunks
│   │   └── utils-[hash].js
│   ├── icons/
│   └── _locales/
│       └── en/
│           └── messages.json
└── chrome-mv3-dev/             # Development build with HMR
    └── ...
```

### Manual Vite Build Output

```
dist/
├── manifest.json
├── background.js
├── popup/
│   ├── index.html
│   └── assets/
│       ├── main-[hash].js
│       └── style-[hash].css
├── welcome/
│   ├── index.html
│   └── assets/
│       ├── main-[hash].js
│       └── style-[hash].css
├── icons/
└── _locales/
```

## Test Organization

### Co-located vs Separate Tests

**Recommendation:** Separate `tests/` directory for this project.

**Rationale:**
- Chrome extension contexts (background, popup) have different runtime environments
- E2E tests need Playwright fixtures that don't belong near source
- Unit tests mock Chrome APIs which requires setup files
- Cleaner build output without test files

### Test Structure

```
tests/
├── setup/
│   ├── chrome-mock.ts          # Vitest chrome API mock setup
│   └── test-utils.ts           # Shared test helpers
├── unit/
│   ├── url-match.test.ts       # Pure function tests
│   ├── storage.test.ts         # Storage wrapper tests
│   └── background/
│       └── navigation.test.ts  # Service worker logic tests
└── e2e/
    ├── fixtures/
    │   └── extension.ts        # Playwright extension fixture
    ├── navigation.spec.ts      # Full navigation flow tests
    └── settings.spec.ts        # Popup settings tests
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['tests/setup/chrome-mock.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/entrypoints/**/*.html'],
    },
  },
});
```

### Chrome API Mocking

```typescript
// tests/setup/chrome-mock.ts
import { vi } from 'vitest';
import * as chrome from 'vitest-chrome';

// Set up chrome mock globally
Object.assign(globalThis, { chrome });

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Anti-Patterns

### Anti-Pattern 1: Persistent State in Service Worker

**What people do:** Store state in module-level variables in the service worker.
**Why it's wrong:** Service workers can be terminated at any time by Chrome. State is lost.
**Do this instead:** Always read state from chrome.storage when needed. Use storage.onChanged to react to updates.

### Anti-Pattern 2: Synchronous Chrome API Calls

**What people do:** Use callback-based Chrome APIs without proper async handling.
**Why it's wrong:** Makes code harder to read, error-prone, callback hell.
**Do this instead:** Use promise-based wrappers. WXT provides `browser.*` APIs that return promises.

### Anti-Pattern 3: Large Bundled vendor.js

**What people do:** Bundle jQuery, React, or other large frameworks for simple UIs.
**Why it's wrong:** Increases extension size, slower load times, often unnecessary.
**Do this instead:** Use vanilla TypeScript for simple UIs. QuickTab's popup is too simple to justify a framework.

### Anti-Pattern 4: Inline Event Handlers in Manifest

**What people do:** Define event handlers outside of `defineBackground()` or top-level scope.
**Why it's wrong:** In MV3, event listeners must be registered synchronously on service worker startup.
**Do this instead:** Register all chrome.* event listeners at the top level of your background script.

## Integration Points

### Chrome APIs Used

| API | Purpose | Notes |
|-----|---------|-------|
| chrome.webNavigation | Intercept navigation events | Requires `webNavigation` permission |
| chrome.tabs | Query, update, focus, close tabs | Requires `tabs` permission |
| chrome.scripting | Execute scripts in tabs | Requires `scripting` permission, replaces deprecated executeScript |
| chrome.storage.local | Persist user settings | Requires `storage` permission |
| chrome.action | Icon state, popup | MV3 replacement for browserAction/pageAction |
| chrome.runtime | Install events, messaging | Always available |
| chrome.i18n | Localized strings | Uses _locales/ directory |

### Host Permissions

```json
{
  "host_permissions": [
    "https://*.zendesk.com/*"
  ]
}
```

Required for:
- webNavigation filters to work on zendesk.com
- scripting.executeScript to inject code into Zendesk tabs

## Framework Recommendation

### Primary Recommendation: WXT

**Why WXT over manual Vite setup:**
1. **Automatic manifest generation** - No manual manifest.json maintenance
2. **File-based entrypoints** - Cleaner organization, less boilerplate
3. **HMR for service workers** - Traditionally impossible, WXT makes it work
4. **TypeScript-first** - Built-in types, no additional setup
5. **Actively maintained** - CRXJS was at risk of abandonment, WXT has momentum
6. **Cross-browser ready** - Easy to add Firefox support later if needed

**Why not CRXJS:**
- Maintenance uncertainty (required community rescue in 2025)
- WXT provides same benefits plus more features
- WXT has better documentation and community support

**Why not manual Vite:**
- Significant boilerplate for multi-entry Chrome extensions
- Manual manifest maintenance is error-prone
- No HMR for service workers without plugins

### Migration Path from Current Structure

| Current | Target (WXT) |
|---------|--------------|
| `app/javascripts/tabWatcher.js` | `src/entrypoints/background.ts` |
| `app/javascripts/browser/*.js` | `src/utils/*.ts` (merged, typed) |
| `app/javascripts/modules/*.js` | `src/utils/*.ts` (merged, typed) |
| `app/javascripts/popup.js` | `src/entrypoints/popup/main.ts` |
| `app/javascripts/welcome.js` | `src/entrypoints/welcome/main.ts` |
| `app/popup.html` | `src/entrypoints/popup/index.html` |
| `app/welcome.html` | `src/entrypoints/welcome/index.html` |
| `app/manifest.json` | Auto-generated by WXT |
| `app/_locales/` | `public/_locales/` |
| `Gruntfile.js` + `webpack.config.js` | `wxt.config.ts` |

## Sources

- [WXT Official Documentation](https://wxt.dev/) - HIGH confidence
- [WXT Project Structure Guide](https://wxt.dev/guide/essentials/project-structure) - HIGH confidence
- [WXT Entrypoints Documentation](https://wxt.dev/guide/essentials/entrypoints.html) - HIGH confidence
- [Chrome Extension Manifest V3 Documentation](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3) - HIGH confidence
- [vitest-chrome GitHub](https://github.com/probil/vitest-chrome) - HIGH confidence
- [2025 Browser Extension Framework Comparison](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/) - MEDIUM confidence
- [CRXJS Vite Plugin](https://crxjs.dev/vite-plugin/) - MEDIUM confidence (maintenance concerns)

---
*Architecture research for: Chrome Extension (TypeScript + Vite + Manifest V3)*
*Researched: 2026-01-25*

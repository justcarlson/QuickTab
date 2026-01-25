# Phase 3: UI Migration - Research

**Researched:** 2026-01-25
**Domain:** Vanilla TypeScript UI, Chrome i18n API, Accessible Toggle Components, CSS Dark Mode
**Confidence:** HIGH

## Summary

This phase migrates the popup and welcome page from jQuery/Handlebars to vanilla TypeScript with modern CSS. The existing UI relies on jQuery for DOM manipulation and Handlebars for templating with a custom i18n helper. The new implementation uses plain HTML, vanilla TypeScript, and the native Chrome i18n API.

The service worker communication layer already exists from Phase 2 - the background script handles `getStatus` and `setMode` messages for popup state management. The storage wrapper (`src/utils/storage.ts`) provides `getUrlDetection()` and `setUrlDetection()` functions. The popup simply needs to send runtime messages to the background script.

The visual design shifts from the legacy Zendesk-branded look to a fresh minimal design with dark mode support via `prefers-color-scheme`. The mode toggle uses an iOS-style switch with proper ARIA accessibility (`role="switch"`, `aria-checked`). The welcome page reuses the existing hero illustration assets from `app/images/pages/welcome/`.

**Primary recommendation:** Build popup and welcome page as plain HTML with TypeScript event handlers. Use CSS custom properties for theming with `prefers-color-scheme` media queries for automatic dark mode. Implement the toggle as an accessible checkbox with `role="switch"`. Copy existing hero images to `public/images/pages/welcome/` and locale files are already in `public/_locales/`.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla TypeScript | ^5.9.3 | UI logic | No framework overhead; direct DOM APIs; already configured |
| CSS Custom Properties | Native | Theming | Dark mode via media queries; no build step required |
| Chrome i18n API | MV3 | Localization | `chrome.i18n.getMessage()` - native extension API |
| WXT HTML Entrypoints | ^0.20.13 | Build system | Processes HTML files in entrypoints/ folder |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/chrome | ^0.0.287 | Type definitions | Already installed; provides i18n types |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla TS | Preact/Lit | Adds bundle size; popup is too simple to justify |
| CSS vars | Tailwind CSS | Adds build complexity; custom properties sufficient for theming |
| Native i18n | i18next | Extra dependency; Chrome API works directly |
| Checkbox switch | Button toggle | Checkbox has native form behavior; simpler implementation |

**Installation:**
No additional dependencies required - all tooling in place from Phase 1 & 2.

## Architecture Patterns

### Recommended Project Structure

```
entrypoints/
├── popup/
│   ├── index.html        # Static HTML with i18n placeholders
│   ├── main.ts           # Event handlers, message passing
│   └── style.css         # Styles with CSS custom properties
├── welcome/
│   ├── index.html        # Welcome page HTML
│   ├── main.ts           # Minimal JS (maybe just i18n hydration)
│   └── style.css         # Welcome page styles
public/
├── _locales/
│   └── en/
│       └── messages.json # Existing locale strings
└── images/
    ├── icons/            # Extension icons (existing)
    └── pages/
        └── welcome/      # Hero images (copy from app/)
            ├── hero-v2.png
            └── hero-v2.webp
```

### Pattern 1: Message-Based Popup Communication

**What:** Popup sends messages to background script; doesn't access storage directly
**When to use:** All popup state operations
**Example:**
```typescript
// entrypoints/popup/main.ts
// Source: https://developer.chrome.com/docs/extensions/develop/concepts/messaging

interface GetStatusResponse {
  mode: 'allUrls' | 'ticketUrls' | 'noUrls';
}

async function getCurrentMode(): Promise<string> {
  const response = await chrome.runtime.sendMessage({ type: 'getStatus' });
  return (response as GetStatusResponse).mode;
}

async function setMode(mode: string): Promise<void> {
  await chrome.runtime.sendMessage({ type: 'setMode', mode });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  const mode = await getCurrentMode();
  updateToggleUI(mode);
});
```

### Pattern 2: Accessible Toggle Switch with role="switch"

**What:** Checkbox styled as iOS toggle with proper ARIA semantics
**When to use:** Binary on/off toggles
**Example:**
```html
<!-- Source: https://www.w3.org/WAI/ARIA/apg/patterns/switch/ -->
<label class="switch">
  <input type="checkbox" role="switch" aria-checked="false" id="mode-toggle">
  <span class="slider" aria-hidden="true"></span>
  <span class="switch-label">All agent links</span>
</label>
```

```typescript
// entrypoints/popup/main.ts
const toggle = document.getElementById('mode-toggle') as HTMLInputElement;

toggle.addEventListener('change', async () => {
  const newMode = toggle.checked ? 'allUrls' : 'noUrls';
  toggle.setAttribute('aria-checked', String(toggle.checked));
  await setMode(newMode);
});
```

### Pattern 3: CSS Dark Mode with prefers-color-scheme

**What:** CSS custom properties that change based on system theme
**When to use:** All color values
**Example:**
```css
/* entrypoints/popup/style.css */
/* Source: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme */

:root {
  /* Light mode (default) */
  --bg: #f7f7f2;
  --surface: #ffffff;
  --text: #1b1d1a;
  --muted: #5a5f56;
  --border: #e5e6dd;
  --accent: #c8f05a;
  --accent-soft: #eef7d6;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111311;
    --surface: #1c1f1c;
    --text: #f2f4ef;
    --muted: #a4aba0;
    --border: #2e332d;
    --accent: #c8f05a;
    --accent-soft: #20300f;
  }
}

body {
  background: var(--bg);
  color: var(--text);
}
```

### Pattern 4: Chrome i18n in HTML and TypeScript

**What:** Use `__MSG_key__` syntax in HTML, `chrome.i18n.getMessage()` in JS
**When to use:** All user-visible strings
**Example:**
```html
<!-- index.html - static placeholders substituted at runtime -->
<title>__MSG_appName__</title>
<!-- OR populate via JavaScript for dynamic content -->
<h1 id="title"></h1>
```

```typescript
// main.ts
// Source: https://developer.chrome.com/docs/extensions/reference/api/i18n
document.getElementById('title')!.textContent =
  chrome.i18n.getMessage('txt_popup_title_link_detection');
```

### Pattern 5: Three-State Mode Toggle (Radio Group Alternative)

**What:** For popup's three detection modes (allUrls, ticketUrls, noUrls)
**When to use:** When user needs to select one of N options
**Example:**
```html
<!-- Per CONTEXT.md: iOS-style switch for mode toggle -->
<!-- Simplified to single toggle: ON = allUrls, OFF = noUrls -->
<!-- ticketUrls could be a secondary option if needed -->
<fieldset id="mode-settings" role="radiogroup" aria-labelledby="mode-label">
  <legend id="mode-label">Link handling</legend>
  <label class="mode-option">
    <input type="radio" name="mode" value="allUrls" checked>
    <span>All agent links</span>
  </label>
  <label class="mode-option">
    <input type="radio" name="mode" value="ticketUrls">
    <span>Ticket links only</span>
  </label>
  <label class="mode-option">
    <input type="radio" name="mode" value="noUrls">
    <span>Off (disabled)</span>
  </label>
</fieldset>
```

### Anti-Patterns to Avoid

- **Inline event handlers:** Use `addEventListener` in TypeScript instead of `onclick` attributes
- **Direct storage access in popup:** Always use runtime messaging to background script
- **Hardcoded strings:** Use `chrome.i18n.getMessage()` for all user-visible text
- **Fixed colors:** Use CSS custom properties for all colors to support dark mode
- **Inaccessible toggles:** Always include `role="switch"` and `aria-checked` or use native radio/checkbox

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| i18n string lookup | Custom JSON loader | `chrome.i18n.getMessage()` | Built-in, handles fallbacks, manifest integration |
| Dark mode detection | Custom JS detection | `@media (prefers-color-scheme: dark)` | Pure CSS, no JS needed, respects OS preference |
| Toggle state | Custom state management | Native checkbox `checked` property | Form state built-in, works with form validation |
| Popup → background comms | Custom storage listener | `chrome.runtime.sendMessage()` | Standard messaging API, already implemented in Phase 2 |
| Welcome page open | Custom URL builder | `chrome.runtime.getURL()` | Handles extension URL scheme correctly |

**Key insight:** The Chrome extension APIs provide everything needed for popup state and i18n. No additional libraries required for this UI complexity level.

## Common Pitfalls

### Pitfall 1: Popup Closes Before Async Operation Completes

**What goes wrong:** User clicks toggle, popup closes, mode doesn't change
**Why it happens:** `sendMessage` is async; popup may close before response
**How to avoid:** Keep popup open until operation completes; use visual feedback
**Warning signs:** Mode appears unchanged after clicking toggle

```typescript
// WRONG - popup may close before message sends
toggle.addEventListener('change', () => {
  chrome.runtime.sendMessage({ type: 'setMode', mode: newMode });
  // Popup closes, message may not complete
});

// CORRECT - await completion before any close
toggle.addEventListener('change', async () => {
  await chrome.runtime.sendMessage({ type: 'setMode', mode: newMode });
  // Message confirmed received
});
```

### Pitfall 2: i18n Strings Show __MSG_key__ in HTML

**What goes wrong:** Raw placeholder text visible instead of translated string
**Why it happens:** HTML `__MSG_*__` syntax only works in manifest.json and CSS files, not HTML
**How to avoid:** Populate text content via JavaScript using `chrome.i18n.getMessage()`
**Warning signs:** Text like `__MSG_txt_popup_title__` visible in popup

```html
<!-- WRONG - __MSG__ doesn't work in HTML content -->
<h1>__MSG_txt_popup_title__</h1>

<!-- CORRECT - use JavaScript to populate -->
<h1 id="title"></h1>
<script>
  document.getElementById('title').textContent =
    chrome.i18n.getMessage('txt_popup_title');
</script>
```

### Pitfall 3: Toggle State Not Reflecting Actual Mode

**What goes wrong:** Toggle shows "on" but mode is actually "off" in storage
**Why it happens:** UI initialized before background script responds
**How to avoid:** Load current state from background before showing UI; add loading state
**Warning signs:** Toggle position doesn't match extension behavior

```typescript
// CORRECT - wait for state before showing UI
document.addEventListener('DOMContentLoaded', async () => {
  const response = await chrome.runtime.sendMessage({ type: 'getStatus' });
  const toggle = document.getElementById('mode-toggle') as HTMLInputElement;
  toggle.checked = response.mode !== 'noUrls';
  document.body.classList.remove('loading');
});
```

### Pitfall 4: Images Don't Load in Welcome Page

**What goes wrong:** Hero image shows broken image icon
**Why it happens:** Image path incorrect for extension context; assets not in public/
**How to avoid:** Copy assets to public/ folder; use relative paths from HTML file
**Warning signs:** 404 errors in DevTools for image URLs

```
# Assets must be in public/ folder for WXT to include them
public/
└── images/
    └── pages/
        └── welcome/
            ├── hero-v2.png
            └── hero-v2.webp
```

```html
<!-- Paths relative to welcome/index.html location -->
<picture>
  <source srcset="/images/pages/welcome/hero-v2.webp" type="image/webp">
  <img src="/images/pages/welcome/hero-v2.png" alt="QuickTab demo">
</picture>
```

### Pitfall 5: Radio Buttons Don't Look Like iOS Toggle

**What goes wrong:** Default radio buttons instead of switch UI
**Why it happens:** CSS not hiding native inputs or not styling custom elements
**How to avoid:** Use `appearance: none` or visually hide input; style label/span as switch
**Warning signs:** Native browser radio buttons visible

```css
/* Hide native input, style the visual switch */
.switch input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.switch .slider {
  /* iOS-style switch styling */
  width: 44px;
  height: 24px;
  background-color: var(--muted);
  border-radius: 12px;
  transition: background-color 0.2s;
}

.switch input:checked + .slider {
  background-color: var(--accent);
}
```

## Code Examples

Verified patterns from official sources:

### Complete Popup HTML Structure

```html
<!-- entrypoints/popup/index.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuickTab</title>
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  <div id="app" class="loading">
    <header>
      <h1 id="app-title">QuickTab</h1>
    </header>

    <section id="mode-section">
      <h2 id="mode-heading"></h2>
      <div class="mode-options">
        <!-- Mode options populated by JS -->
      </div>
    </section>

    <section id="help-section">
      <h2 id="help-heading"></h2>
      <ul>
        <li><a href="https://github.com/zendesklabs/QuickTab#readme"
               target="_blank" id="link-docs"></a></li>
        <li><a href="#" id="link-welcome"></a></li>
      </ul>
    </section>
  </div>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

### Complete Popup TypeScript

```typescript
// entrypoints/popup/main.ts
// Source: Chrome messaging API, ARIA switch pattern

type UrlDetectionMode = 'allUrls' | 'ticketUrls' | 'noUrls';

interface GetStatusResponse {
  mode: UrlDetectionMode;
}

// Localization helper
function t(key: string): string {
  return chrome.i18n.getMessage(key) || `[${key}]`;
}

// Message helpers
async function getStatus(): Promise<UrlDetectionMode> {
  const response = await chrome.runtime.sendMessage({ type: 'getStatus' });
  return (response as GetStatusResponse).mode;
}

async function setMode(mode: UrlDetectionMode): Promise<void> {
  await chrome.runtime.sendMessage({ type: 'setMode', mode });
}

// UI update function
function updateModeUI(currentMode: UrlDetectionMode): void {
  const radios = document.querySelectorAll<HTMLInputElement>(
    'input[name="detection-mode"]'
  );
  radios.forEach(radio => {
    radio.checked = radio.value === currentMode;
  });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Populate i18n strings
  document.getElementById('mode-heading')!.textContent =
    t('txt_popup_title_link_detection');
  document.getElementById('help-heading')!.textContent =
    t('txt_popup_title_help');
  document.getElementById('link-docs')!.textContent =
    t('txt_popup_options_help_documentation');
  document.getElementById('link-welcome')!.textContent =
    t('txt_popup_options_help_welcome');

  // Load current mode
  const currentMode = await getStatus();
  updateModeUI(currentMode);

  // Remove loading state
  document.getElementById('app')!.classList.remove('loading');

  // Bind mode change handlers
  document.querySelectorAll<HTMLInputElement>('input[name="detection-mode"]')
    .forEach(radio => {
      radio.addEventListener('change', async () => {
        if (radio.checked) {
          await setMode(radio.value as UrlDetectionMode);
        }
      });
    });

  // Bind welcome link
  document.getElementById('link-welcome')!.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: 'openWelcome' });
  });
});
```

### iOS-Style Toggle CSS

```css
/* entrypoints/popup/style.css */
/* Source: W3C ARIA Switch Pattern, MDN prefers-color-scheme */

:root {
  /* Light mode palette - from existing _variables.scss */
  --bg: #f7f7f2;
  --surface: #ffffff;
  --text: #1b1d1a;
  --muted: #5a5f56;
  --border: #e5e6dd;
  --accent: #c8f05a;
  --accent-dark: #9fd138;
  --accent-soft: #eef7d6;

  /* Typography */
  --font-body: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  --font-heading: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111311;
    --surface: #1c1f1c;
    --text: #f2f4ef;
    --muted: #a4aba0;
    --border: #2e332d;
    --accent: #c8f05a;
    --accent-dark: #9fd138;
    --accent-soft: #20300f;
  }
}

* {
  box-sizing: border-box;
}

body {
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.4;
  color: var(--text);
  background: var(--bg);
  margin: 0;
  padding: 12px;
  min-width: 240px;
}

/* Loading state - hide content until initialized */
.loading {
  opacity: 0.5;
  pointer-events: none;
}

/* Mode option as iOS-style switch */
.mode-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.mode-option:hover {
  background-color: var(--accent-soft);
}

.mode-option input {
  /* Visually hidden but accessible */
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.mode-option .indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--border);
  transition: all 0.15s;
}

.mode-option input:checked + .indicator {
  border-color: var(--accent);
  background-color: var(--accent);
}

.mode-option input:focus-visible + .indicator {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* iOS toggle switch (for single on/off if used) */
.switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.switch input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
}

.switch .slider {
  width: 44px;
  height: 24px;
  background-color: var(--muted);
  border-radius: 12px;
  position: relative;
  transition: background-color 0.2s ease;
}

.switch .slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: white;
  top: 2px;
  left: 2px;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.switch input:checked + .slider {
  background-color: var(--accent);
}

.switch input:checked + .slider::before {
  transform: translateX(20px);
}

.switch input:focus-visible + .slider {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Section headings */
h2 {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  margin: 16px 0 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}

/* Links */
a {
  color: var(--text);
  text-decoration: none;
}

a:hover {
  color: var(--accent-dark);
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  padding: 8px 12px;
  border-radius: 8px;
}

li:hover {
  background-color: var(--accent-soft);
}
```

### Welcome Page Structure

```html
<!-- entrypoints/welcome/index.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to QuickTab</title>
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  <main id="app">
    <p id="thank-you" class="eyebrow"></p>
    <h1 id="headline"></h1>
    <p id="hook" class="lead"></p>

    <div id="hero-container">
      <picture>
        <source srcset="/images/pages/welcome/hero-v2.webp" type="image/webp">
        <img src="/images/pages/welcome/hero-v2.png"
             alt="QuickTab routing a Zendesk link to an existing tab"
             id="hero-image">
      </picture>
    </div>

    <div class="faq-grid">
      <article class="faq-card">
        <h3 id="faq-1-title"></h3>
        <p id="faq-1-body"></p>
      </article>
      <article class="faq-card">
        <h3 id="faq-2-title"></h3>
        <p id="faq-2-body"></p>
      </article>
      <article class="faq-card">
        <h3 id="faq-3-title"></h3>
        <p id="faq-3-body"></p>
      </article>
      <article class="faq-card">
        <h3 id="faq-4-title"></h3>
        <p id="faq-4-body"></p>
      </article>
    </div>

    <a href="https://github.com/zendesklabs/QuickTab#readme"
       target="_blank"
       class="button"
       id="cta-button"></a>
  </main>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

### Welcome Page TypeScript

```typescript
// entrypoints/welcome/main.ts

function t(key: string): string {
  return chrome.i18n.getMessage(key) || `[${key}]`;
}

document.addEventListener('DOMContentLoaded', () => {
  // Populate all i18n strings
  document.getElementById('thank-you')!.textContent =
    t('txt_welcome_header_thank_you');
  document.getElementById('headline')!.textContent =
    t('txt_welcome_header_main');
  document.getElementById('hook')!.textContent =
    t('txt_welcome_header_hook');

  // FAQ cards
  document.getElementById('faq-1-title')!.textContent =
    t('txt_welcome_header_what_do');
  document.getElementById('faq-1-body')!.textContent =
    t('txt_welcome_body_what_do');
  document.getElementById('faq-2-title')!.textContent =
    t('txt_welcome_header_new_browser_tab');
  document.getElementById('faq-2-body')!.textContent =
    t('txt_welcome_body_new_browser_tab');
  document.getElementById('faq-3-title')!.textContent =
    t('txt_welcome_header_lose_work');
  document.getElementById('faq-3-body')!.textContent =
    t('txt_welcome_body_lose_work');
  document.getElementById('faq-4-title')!.textContent =
    t('txt_welcome_header_what_links');
  document.getElementById('faq-4-body')!.textContent =
    t('txt_welcome_body_what_links');

  // CTA button
  document.getElementById('cta-button')!.textContent =
    t('txt_welcome_button_read_docs');
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jQuery DOM manipulation | Native `document.querySelector`, `addEventListener` | Baseline 2020 | Zero dependencies |
| Handlebars templates | Plain HTML + TypeScript | Modern practice | Simpler, no runtime template engine |
| Custom i18n helpers | `chrome.i18n.getMessage()` | Chrome API native | Built-in fallback chain |
| CSS preprocessors for theming | CSS custom properties + media queries | Baseline 2020 | Pure CSS dark mode |
| Manual toggle state | `role="switch"` + `aria-checked` | ARIA 1.1 | Screen reader support |
| Fixed color values | CSS custom properties | Baseline 2020 | Theme switching |

**Deprecated/outdated:**
- **jQuery:** Not needed for simple DOM manipulation; vanilla APIs sufficient
- **Handlebars:** Template literals or plain HTML more maintainable for small UIs
- **CSS variables polyfills:** IE11 support dropped; native CSS custom properties universal
- **Manual dark mode JS:** `prefers-color-scheme` media query handles system preference

## Open Questions

Things that couldn't be fully resolved:

1. **Locale Override Implementation**
   - What we know: CONTEXT.md mentions "Allow locale override in settings"
   - What's unclear: Whether this is Phase 3 scope or deferred
   - Recommendation: Start with system locale via Chrome API; locale picker can be added later

2. **Three-Mode Toggle UI Pattern**
   - What we know: Three modes (allUrls, ticketUrls, noUrls) per existing extension
   - What's unclear: CONTEXT.md says "iOS-style switch" but has three options
   - Recommendation: Use radio group styled as segmented control, or simplified two-state toggle (on/off) per discussion context

3. **Hero Image Sizing**
   - What we know: Existing hero is 4.5MB PNG, 75KB WebP
   - What's unclear: Whether PNG should be optimized or removed
   - Recommendation: Keep both; browser uses WebP if supported; consider compressing PNG

## Sources

### Primary (HIGH confidence)
- [Chrome i18n API](https://developer.chrome.com/docs/extensions/reference/api/i18n) - getMessage(), predefined messages
- [W3C ARIA Switch Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/) - role="switch", aria-checked
- [MDN prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) - Dark mode media query
- [WXT Entrypoints](https://wxt.dev/guide/essentials/entrypoints.html) - HTML page configuration
- [Chrome Action API](https://developer.chrome.com/docs/extensions/reference/api/action) - setIcon, setTitle methods

### Secondary (MEDIUM confidence)
- [web.dev Theme Patterns](https://web.dev/patterns/theming/theme-switch) - Theme switching best practices
- Existing codebase analysis (app/templates/, app/stylesheets/)

### Tertiary (LOW confidence)
- Community blog posts on accessible toggles - verified against W3C APG

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies; vanilla TypeScript + CSS
- Architecture: HIGH - Standard HTML/JS patterns; Chrome API well-documented
- Pitfalls: HIGH - Common issues documented in Chrome extension guides
- i18n: HIGH - Direct API usage; existing messages.json compatible

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable patterns, Chrome APIs stable)

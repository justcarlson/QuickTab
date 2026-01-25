# Stack Research

**Domain:** Chrome Extension (Manifest V3) — TypeScript + Vite modernization
**Researched:** 2026-01-25
**Confidence:** HIGH (versions verified via npm registry, patterns verified via official docs)

## Executive Summary

This research recommends **WXT (Web Extension Toolkit)** as the core framework for modernizing QuickTab from jQuery/Handlebars/Grunt to a TypeScript-first Chrome extension. WXT has emerged as the definitive leading framework for browser extension development in 2025-2026, combining Vite's speed with extension-specific tooling that handles the complexity of Manifest V3.

The stack prioritizes:
1. **Developer experience** — HMR, type safety, auto-imports
2. **Testing confidence** — Vitest 4.x for unit tests, Playwright for E2E
3. **Maintainability** — Unified tooling reduces cognitive overhead
4. **Chrome Web Store readiness** — Manifest V3 compliance, automated ZIP generation

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **WXT** | ^0.20.13 | Extension framework | Industry leader for 2025-2026. Active maintenance, file-based entrypoints, automatic manifest generation, cross-browser support. Preferred over CRXJS (dormant until 2025 revival) and Plasmo (maintenance mode, Parcel-based). | HIGH |
| **TypeScript** | ^5.9.3 | Type safety | Current stable. ES2022+ target for modern syntax. Excellent Vite integration. | HIGH |
| **Vite** | ^7.3.1 | Build tool | WXT dependency. Lightning-fast HMR, native ESM, modern plugin ecosystem. Replaces Grunt+Webpack 1.x entirely. | HIGH |

### Testing Stack

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Vitest** | ^4.0.18 | Unit/integration testing | Vite-native test runner. v4.0 marked Browser Mode stable. Built-in TypeScript support, 10-20x faster than Jest. WXT provides official plugin (`wxt/testing/vitest-plugin`). | HIGH |
| **@webext-core/fake-browser** | ^1.3.4 | Extension API mocking | In-memory implementation of `browser.*` APIs. Used by WXT's Vitest plugin. No manual mocking of `browser.storage`, `browser.tabs`, etc. | HIGH |
| **Playwright** | ^1.58.0 | E2E testing | Official Chrome extension support via persistent contexts. Manifest V3 service worker detection. v1.57+ has improved headless mode for CI. | HIGH |
| **@vitest/browser-playwright** | ^4.0.18 | Component testing | New in Vitest 4. Runs component tests in real browser with visual regression support. | MEDIUM |

### Code Quality

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Biome** | ^2.3.12 | Linting + Formatting | 10-25x faster than ESLint+Prettier. Single config file. Rust-based. v2.0 added type-aware linting (85% parity with typescript-eslint). Excellent for new projects. | HIGH |
| **ESLint 9** | ^9.39.2 | Linting (alternative) | Use if team prefers ESLint ecosystem or needs specific plugins. Flat config now stable. Requires more setup than Biome. | MEDIUM |
| **typescript-eslint** | ^8.53.1 | TypeScript linting | Required if using ESLint. `tseslint.configs.recommended` or `strict`. | MEDIUM |

### Runtime Validation (Optional but Recommended)

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| **Zod** | ^4.3.6 | Schema validation | Validate user settings from `browser.storage`, message payloads between scripts, API responses. Vitest 4 has native Zod schema matching. | HIGH |

### Development Tools

| Tool | Purpose | Notes | Confidence |
|------|---------|-------|------------|
| **pnpm** | Package manager | Faster, disk-efficient. WXT examples use pnpm. Alternative: npm/bun. | MEDIUM |
| **GitHub Actions** | CI/CD | Test + build + create release ZIP. See workflow patterns below. | HIGH |

---

## Installation

```bash
# Initialize new WXT project (interactive)
pnpm dlx wxt@latest init

# Or add to existing project
pnpm add -D wxt typescript

# Testing
pnpm add -D vitest @playwright/test

# Code quality (choose one)
pnpm add -D --save-exact @biomejs/biome   # Option A: Biome
# OR
pnpm add -D eslint typescript-eslint      # Option B: ESLint

# Runtime validation (optional)
pnpm add zod
```

### package.json Scripts

```json
{
  "scripts": {
    "dev": "wxt",
    "dev:firefox": "wxt -b firefox",
    "build": "wxt build",
    "build:firefox": "wxt build -b firefox",
    "zip": "wxt zip",
    "zip:firefox": "wxt zip -b firefox",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "postinstall": "wxt prepare"
  }
}
```

---

## TypeScript Configuration

WXT generates a `.wxt/tsconfig.json` that your project extends.

### tsconfig.json

```json
{
  "extends": ".wxt/tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve"
  },
  "include": [
    ".wxt/**/*.ts",
    "entrypoints/**/*.ts",
    "entrypoints/**/*.tsx",
    "utils/**/*.ts"
  ]
}
```

**Key decisions:**
- `target: ES2022` — Enables top-level await, class fields. Supported by all modern browsers and Chrome's extension runtime.
- `noUncheckedIndexedAccess: true` — Catches undefined access patterns (important for storage/settings).
- `moduleResolution: bundler` — Optimized for Vite bundling.

### Path Aliases

**Do NOT configure aliases in tsconfig.json.** Use `wxt.config.ts` instead:

```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  alias: {
    '@': './utils',
    '@components': './components',
  },
});
```

WXT propagates aliases to both TypeScript and the bundler.

---

## Testing Configuration

### Vitest (Unit Tests)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    globals: true,
    environment: 'node', // Extension scripts run in Node-like env
    include: ['**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
```

**WxtVitest() provides:**
- Polyfilled `browser.*` APIs via `@webext-core/fake-browser`
- Auto-configured aliases (`@/*`, `@@/*`)
- Extension environment globals (`import.meta.env.BROWSER`, etc.)
- No manual mocking required for storage, tabs, runtime, etc.

### Playwright (E2E Tests)

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const pathToExtension = path.join(__dirname, 'dist');

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Extensions require sequential execution

  use: {
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium-extension',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
```

**E2E Test Fixture:**

```typescript
// e2e/fixtures.ts
import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, '../dist');
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    // MV3: Get ID from service worker
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    const extensionId = serviceWorker.url().split('/')[2];
    await use(extensionId);
  },
});

export { expect } from '@playwright/test';
```

**Key considerations:**
- Extensions require headed mode (not headless) in most CI environments
- Service workers in MV3 can suspend — trigger events before assertions
- Dynamic extension IDs — never hardcode `chrome-extension://[id]/`

---

## Code Quality Configuration

### Option A: Biome (Recommended for New Projects)

```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noExcessiveCognitiveComplexity": "warn"
      },
      "suspicious": {
        "noExplicitAny": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5"
    }
  },
  "files": {
    "ignore": ["dist", ".wxt", "node_modules"]
  }
}
```

### Option B: ESLint 9 Flat Config

```javascript
// eslint.config.mjs
// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {
    ignores: ['dist/**', '.wxt/**', 'node_modules/**'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  }
);
```

---

## GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm exec tsc --noEmit

      - name: Unit tests
        run: pnpm test run --coverage

      - name: Build extension
        run: pnpm build

  e2e:
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - name: Install Playwright Chromium
        run: pnpm exec playwright install chromium --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  release-zip:
    runs-on: ubuntu-latest
    needs: [lint-and-test, e2e]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm zip

      - uses: actions/upload-artifact@v4
        with:
          name: chrome-extension-zip
          path: .output/*.zip
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **WXT** | CRXJS | If you need maximum control and minimal abstraction. CRXJS is a plugin, not a framework. Suitable for experts. |
| **WXT** | Plasmo | If team is React-only and wants "Next.js for extensions" DX. However, Plasmo uses Parcel (slower) and appears in maintenance mode. |
| **WXT** | Manual Vite setup | If WXT's abstractions don't fit. Significantly more configuration required. |
| **Biome** | ESLint + Prettier | If team has existing ESLint plugins/configs, needs enterprise compliance rules, or requires 100% typescript-eslint parity. |
| **Vitest** | Jest | Not recommended. Jest lacks native ESM/Vite support, requires more config, and is slower. |
| **Playwright** | Puppeteer | If you're deeply familiar with Puppeteer. Playwright has better API ergonomics and official extension testing docs. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **jQuery** | Unnecessary in 2026. DOM APIs are mature. TypeScript provides better safety than jQuery's chainable API. | Vanilla TypeScript, or framework (React/Vue/Svelte) if complex UI |
| **Handlebars** | Runtime templating is outdated. No type safety. | TypeScript templates, lit-html, or framework components |
| **Grunt** | Obsolete task runner. No HMR, slow, complex config. | Vite (via WXT) |
| **Webpack 1.x** | Ancient. No tree-shaking, slow, complex config. | Vite (via WXT) |
| **Jest** | Poor ESM support, no Vite-native HMR, slower than Vitest. | Vitest |
| **JSHint** | Superseded by ESLint/TypeScript. No longer maintained. | Biome or ESLint with TypeScript |
| **Plasmo** | Maintenance mode. Parcel bundler has technical debt. | WXT |
| **manifest.json (manual)** | WXT generates manifest from entrypoints. Manual maintenance is error-prone. | Let WXT generate it |

---

## WXT Project Structure (Recommended)

```
quicktab/
├── entrypoints/
│   ├── background.ts        # Service worker (MV3)
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── App.tsx          # If using React
│   ├── content.ts           # Content script (injected into pages)
│   └── welcome.html         # Welcome page
├── components/              # Shared UI components
├── utils/
│   ├── storage.ts           # Type-safe storage wrapper
│   ├── messaging.ts         # Type-safe message passing
│   └── zendesk.ts           # Domain-specific logic
├── public/
│   └── icons/               # Extension icons
├── e2e/
│   ├── fixtures.ts
│   └── popup.spec.ts
├── wxt.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── biome.json               # or eslint.config.mjs
├── tsconfig.json
└── package.json
```

---

## Version Compatibility Matrix

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| WXT 0.20.x | Vite 6-7, TypeScript 5.x | WXT bundles Vite internally |
| Vitest 4.x | Vite 6-7 | Must match Vite major version |
| Playwright 1.58.x | Chromium bundled | Use bundled Chromium, not system Chrome |
| Biome 2.x | Any | Standalone, no Vite integration needed |
| TypeScript 5.9.x | ES2022+ target | Full modern syntax support |

---

## Migration Path from Current Stack

| Current | Target | Migration Approach |
|---------|--------|-------------------|
| jQuery 1.6.1 | Vanilla TS | Incremental: extract DOM operations to typed utilities |
| Handlebars 2.0 | TypeScript templates | Replace templates with typed functions returning DocumentFragments |
| Grunt + Webpack 1.x | WXT (Vite) | Scaffold new WXT project, migrate entrypoints one by one |
| JSHint | Biome | Run `npx biome migrate` for automatic conversion |
| No tests | Vitest + Playwright | Add tests alongside migration, not after |
| No CI | GitHub Actions | Add workflow early, enforce on every PR |

---

## Sources

**Framework Comparison:**
- [The 2025 State of Browser Extension Frameworks](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/) — HIGH confidence
- [WXT vs Other Frameworks](https://wxt.dev/guide/resources/compare.html) — HIGH confidence (official docs)

**WXT Documentation:**
- [WXT Installation Guide](https://wxt.dev/guide/installation.html) — HIGH confidence
- [WXT Unit Testing](https://wxt.dev/guide/essentials/unit-testing) — HIGH confidence
- [WXT TypeScript Config](https://wxt.dev/guide/essentials/config/typescript.html) — HIGH confidence

**Testing:**
- [Playwright Chrome Extensions](https://playwright.dev/docs/chrome-extensions) — HIGH confidence (official)
- [Vitest 4.0 Announcement](https://vitest.dev/blog/vitest-4) — HIGH confidence (official)

**Code Quality:**
- [Biome vs ESLint 2025](https://medium.com/better-dev-nextjs-react/biome-vs-eslint-prettier-the-2025-linting-revolution-you-need-to-know-about-ec01c5d5b6c8) — MEDIUM confidence
- [typescript-eslint Getting Started](https://typescript-eslint.io/getting-started/) — HIGH confidence (official)
- [ESLint Flat Config](https://eslint.org/blog/2025/03/flat-config-extends-define-config-global-ignores/) — HIGH confidence (official)

**TypeScript:**
- [TSConfig Target](https://www.typescriptlang.org/tsconfig/target.html) — HIGH confidence (official)

**npm Registry (verified 2026-01-25):**
- WXT: 0.20.13
- Vite: 7.3.1
- Vitest: 4.0.18
- Playwright: 1.58.0
- TypeScript: 5.9.3
- Biome: 2.3.12
- ESLint: 9.39.2
- typescript-eslint: 8.53.1
- Zod: 4.3.6

---

*Stack research for: QuickTab Chrome Extension Modernization*
*Researched: 2026-01-25*

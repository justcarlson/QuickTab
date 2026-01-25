# Phase 1: Build Foundation - Research

**Researched:** 2026-01-25
**Domain:** Modern Chrome Extension Build Infrastructure (WXT, TypeScript, Biome)
**Confidence:** HIGH

## Summary

This phase establishes modern build infrastructure for a Chrome extension migration from legacy Grunt/Webpack 1.x/jQuery to WXT/Vite/TypeScript/Biome. The technology stack is well-documented with stable, production-ready tooling.

WXT v0.20.x is the current standard for Chrome extension development, providing Vite-based bundling with built-in HMR, automatic manifest generation from file conventions, and first-class TypeScript support. Biome v2.3.x replaces both ESLint and Prettier as a unified linter/formatter with 97% Prettier compatibility and 340+ lint rules. TypeScript 5.9.x with strict mode and ES2022 target provides modern type safety.

The existing project uses Manifest V3 (service worker) and has a straightforward structure: background script (tabWatcher.js), popup UI, and welcome page. Migration to WXT's file-based conventions is direct.

**Primary recommendation:** Initialize WXT with vanilla TypeScript template, configure Biome with recommended rules, set up Husky + lint-staged for pre-commit hooks, and add rollup-plugin-visualizer for bundle analysis.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| [wxt](https://wxt.dev/) | ^0.20.13 | Extension framework with Vite | De facto standard for modern extension dev; HMR, auto-manifest, cross-browser |
| [typescript](https://www.typescriptlang.org/) | ^5.9.3 | Type-safe JavaScript | Industry standard; strict mode catches bugs early |
| [@biomejs/biome](https://biomejs.dev/) | ^2.3.11 | Linting and formatting | Replaces ESLint+Prettier; 50x faster, single tool |
| [@types/chrome](https://www.npmjs.com/package/@types/chrome) | latest | Chrome API type definitions | DefinitelyTyped maintained; auto-imported by TypeScript |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| [husky](https://typicode.github.io/husky/) | ^9.x | Git hooks management | Pre-commit enforcement of lint/format |
| [lint-staged](https://github.com/lint-staged/lint-staged) | ^15.x | Run linters on staged files only | Performance: only check changed files |
| [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer) | ^6.0.x | Bundle size visualization | Analyzing bundle composition; BUILD-06 requirement |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| WXT | Plasmo | Plasmo has more abstractions but less flexibility; WXT produces smaller bundles |
| WXT | CRXJS | CRXJS is just a Vite plugin, lacks WXT's file conventions and tooling |
| Biome | ESLint + Prettier | Slower (1-2s vs 50ms for 1k files); requires two tools and complex config |
| @types/chrome | chrome-types | chrome-types auto-generated from Chromium but @types/chrome has better TypeScript integration |

**Installation:**
```bash
npm install -D wxt typescript @biomejs/biome @types/chrome husky lint-staged rollup-plugin-visualizer
```

## Architecture Patterns

### Recommended Project Structure

WXT uses file-based routing with specific conventions. Based on CONTEXT.md decisions:

```
📂 QuickTab/
├── 📂 entrypoints/           # WXT convention - all extension entry points
│   ├── 📄 background.ts      # Service worker (from tabWatcher.js)
│   ├── 📂 popup/             # Popup UI
│   │   ├── 📄 index.html
│   │   ├── 📄 main.ts
│   │   └── 📄 style.css
│   └── 📂 welcome/           # Welcome page (unlisted page)
│       ├── 📄 index.html
│       └── 📄 main.ts
├── 📂 src/
│   └── 📂 utils/             # Shared utilities (per CONTEXT.md decision)
│       ├── 📄 storage.ts
│       └── 📄 url-matching.ts
├── 📂 public/                # Static assets copied as-is
│   ├── 📂 images/
│   │   └── 📂 icons/
│   └── 📂 _locales/          # i18n (per CONTEXT.md decision)
│       └── 📂 en/
│           └── 📄 messages.json
├── 📄 wxt.config.ts          # WXT configuration + manifest
├── 📄 tsconfig.json          # Extends .wxt/tsconfig.json
├── 📄 biome.json             # Linter/formatter config
└── 📄 package.json
```

### Pattern 1: WXT Entrypoint Definition

**What:** Background scripts use `defineBackground()` wrapper for configuration
**When to use:** All background.ts files
**Example:**
```typescript
// entrypoints/background.ts
// Source: https://wxt.dev/guide/essentials/entrypoints.html
export default defineBackground({
  // MV3 uses service worker by default
  type: 'module',
  main() {
    // All initialization code MUST be inside main()
    // Cannot be async - register listeners synchronously
    console.log('Background loaded');
  },
});
```

### Pattern 2: WXT Config with Manifest

**What:** Single config file defines both WXT and manifest settings
**When to use:** wxt.config.ts
**Example:**
```typescript
// wxt.config.ts
// Source: https://wxt.dev/guide/essentials/config/manifest
import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  entrypointsDir: 'entrypoints',
  manifest: {
    name: 'Zendesk Quicktab',
    description: 'Well behaved browser tabs for Zendesk agents',
    permissions: ['webNavigation', 'tabs', 'scripting', 'storage'],
    host_permissions: ['http://*.zendesk.com/*', 'https://*.zendesk.com/*'],
  },
  vite: () => ({
    build: {
      sourcemap: true, // Enable source maps for debugging
    },
  }),
});
```

### Pattern 3: TypeScript Configuration

**What:** Extend WXT-generated tsconfig with strict settings
**When to use:** tsconfig.json at project root
**Example:**
```json
// tsconfig.json
// Source: https://wxt.dev/guide/essentials/config/typescript.html
{
  "extends": ".wxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true
  }
}
```

### Pattern 4: Biome Configuration

**What:** Unified linter/formatter config with recommended rules
**When to use:** biome.json at project root
**Example:**
```json
// biome.json
// Source: https://biomejs.dev/guides/getting-started/
{
  "$schema": "https://biomejs.dev/schemas/2.3.0/schema.json",
  "organizeImports": { "enabled": true },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "files": {
    "ignore": [".wxt/", ".output/", "node_modules/", "dist/"]
  }
}
```

### Anti-Patterns to Avoid

- **Runtime code outside main():** WXT imports entrypoints in Node.js during build; runtime code must be inside `main()` or functions it calls
- **Manual manifest.json:** WXT generates manifest; configure via wxt.config.ts and file conventions
- **Custom path aliases in tsconfig.json:** Use `alias` option in wxt.config.ts instead
- **modules/ directory conflict:** WXT reserves `modules/` for WXT modules; use different name for app code

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Extension bundling | Custom Webpack/Rollup config | WXT (Vite-based) | Extension-specific optimizations, HMR, manifest gen |
| Chrome API types | Manual type definitions | @types/chrome | 500+ API types maintained by community |
| Code formatting | Manual style enforcement | Biome formatter | Consistent, fast, integrates with linter |
| Import organization | Manual sorting | Biome organizeImports | Automated, consistent, part of format step |
| Git hooks | Shell scripts in .git/hooks | Husky | Cross-platform, team-shareable, npm install auto-setup |

**Key insight:** WXT abstracts away the complexity of extension bundling (manifest generation, cross-browser support, HMR for service workers) that would take weeks to replicate manually.

## Common Pitfalls

### Pitfall 1: Background Script Async Main

**What goes wrong:** Using `async main()` in defineBackground causes listeners to not register
**Why it happens:** Chrome MV3 requires synchronous listener registration at service worker startup
**How to avoid:** Never make `main()` async; call async functions from within sync listeners
**Warning signs:** Extension doesn't intercept navigation; background script appears to not run

```typescript
// WRONG
export default defineBackground({
  async main() {  // NEVER DO THIS
    await loadSettings();
    chrome.webNavigation.onBeforeNavigate.addListener(...);
  },
});

// CORRECT
export default defineBackground({
  main() {
    // Register listeners synchronously
    chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
      const settings = await loadSettings();
      // Handle navigation
    });
  },
});
```

### Pitfall 2: Modules Directory Conflict

**What goes wrong:** `wxt prepare` and other commands fail with cryptic errors
**Why it happens:** WXT 0.20+ reserves `modules/` directory for WXT modules
**How to avoid:** Name your shared code directory `utils/`, `lib/`, or `shared/`
**Warning signs:** Errors mentioning "WXT modules" when you don't have any

### Pitfall 3: CommonJS Imports in WXT

**What goes wrong:** Build fails with module resolution errors
**Why it happens:** WXT requires ESM; CommonJS syntax (`require()`) not supported
**How to avoid:** Use `import`/`export` syntax; add `"type": "module"` to package.json
**Warning signs:** `require is not defined`, `module is not defined` errors

### Pitfall 4: Missing Source Maps in Production

**What goes wrong:** Can't debug production extension in DevTools
**Why it happens:** Vite defaults may not enable source maps for all output
**How to avoid:** Explicitly set `sourcemap: true` in vite config within wxt.config.ts
**Warning signs:** Minified code in DevTools Sources panel

### Pitfall 5: Pre-commit Hook Not Running

**What goes wrong:** Commits go through without linting/formatting
**Why it happens:** Husky not initialized after npm install, or hooks not executable
**How to avoid:** Run `npx husky init` after install; ensure `.husky/pre-commit` is executable
**Warning signs:** `git commit` succeeds instantly without lint output

## Code Examples

Verified patterns from official sources:

### WXT npm Scripts (package.json)

```json
// Source: https://wxt.dev/get-started/installation.html
{
  "scripts": {
    "dev": "wxt",
    "dev:firefox": "wxt -b firefox",
    "build": "wxt build",
    "build:firefox": "wxt build -b firefox",
    "zip": "wxt zip",
    "postinstall": "wxt prepare",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "analyze": "wxt build && npx vite-bundle-visualizer"
  }
}
```

### Husky + lint-staged Setup

```json
// package.json additions
// Source: https://typicode.github.io/husky/get-started.html
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["biome check --write"],
    "*.{json,md,html,css}": ["biome format --write"]
  }
}
```

```bash
# .husky/pre-commit
# Source: https://github.com/lint-staged/lint-staged
npx lint-staged
```

### Bundle Analysis with Vite Visualizer

```typescript
// wxt.config.ts - add visualizer for bundle analysis
// Source: https://github.com/btd/rollup-plugin-visualizer
import { defineConfig } from 'wxt';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  vite: (env) => ({
    plugins: env.mode === 'production' ? [
      visualizer({
        filename: '.output/stats.html',
        template: 'treemap',
        gzipSize: true,
      }),
    ] : [],
    build: {
      sourcemap: true,
    },
  }),
});
```

### Minimal Background Entrypoint

```typescript
// entrypoints/background.ts
// Source: https://wxt.dev/guide/essentials/entrypoints.html
export default defineBackground(() => {
  console.log('QuickTab background loaded', { id: browser.runtime.id });
});
```

### HTML Popup Entrypoint

```html
<!-- entrypoints/popup/index.html -->
<!-- Source: https://wxt.dev/guide/essentials/entrypoints.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>QuickTab</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Grunt + Webpack 1.x | WXT (Vite-based) | 2023-2024 | 10x faster builds, native HMR |
| ESLint + Prettier | Biome | 2023-2025 | Single tool, 50x faster |
| Manual manifest.json | WXT auto-generation | 2023 | File-based conventions reduce errors |
| @types/webextension-polyfill | @types/chrome | WXT 0.20+ | Better MV3 type coverage |
| CJS modules | ESM only | WXT 0.20+ | Modern module system, tree shaking |

**Deprecated/outdated:**
- **grunt-*:** Replaced by Vite-based tooling (WXT)
- **webpack 1.x:** Ancient version; WXT uses Vite/Rollup internally
- **jQuery 1.6.1:** Phase 3 will migrate to vanilla TypeScript
- **Handlebars:** Phase 3 will migrate to vanilla TypeScript templates
- **ESLint + Prettier:** Biome replaces both with single faster tool
- **webextension-polyfill types:** WXT 0.20+ uses @types/chrome directly

## Open Questions

Things that couldn't be fully resolved:

1. **Source map configuration for content scripts**
   - What we know: Vite supports sourcemaps, WXT passes config through
   - What's unclear: Whether content script source maps work seamlessly in DevTools
   - Recommendation: Test during implementation; fallback to console debugging if issues

2. **Biome type-aware linting performance**
   - What we know: Biome 2.0+ has type-aware rules like noFloatingPromises
   - What's unclear: Performance impact on incremental builds
   - Recommendation: Enable recommended rules first; add type-aware rules if needed

## Sources

### Primary (HIGH confidence)
- [WXT Official Documentation](https://wxt.dev/) - Project structure, entrypoints, configuration
- [WXT GitHub Releases](https://github.com/wxt-dev/wxt/releases) - Version 0.20.13 current
- [Biome Official Documentation](https://biomejs.dev/) - Getting started, linter rules
- [TypeScript Documentation](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html) - 5.9 features
- [Husky Official Docs](https://typicode.github.io/husky/get-started.html) - Git hooks setup

### Secondary (MEDIUM confidence)
- [WXT Migration Discussions](https://github.com/wxt-dev/wxt/discussions/922) - Common pitfalls from real migrations
- [The 2025 State of Browser Extension Frameworks](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/) - Framework comparison
- [rollup-plugin-visualizer GitHub](https://github.com/btd/rollup-plugin-visualizer) - Bundle analysis setup
- [lint-staged GitHub](https://github.com/lint-staged/lint-staged) - Configuration patterns

### Tertiary (LOW confidence)
- Various blog posts about WXT setup - Patterns verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools have official documentation, stable releases
- Architecture: HIGH - WXT conventions well-documented, patterns verified
- Pitfalls: MEDIUM - Gathered from GitHub discussions and migration guides

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable tooling, slow-moving)

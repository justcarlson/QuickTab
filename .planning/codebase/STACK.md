# Technology Stack

**Analysis Date:** 2026-01-25

## Languages

**Primary:**
- JavaScript (ES5) - All extension code and build scripts
- HTML/CSS - UI templates and stylesheets

**Secondary:**
- JSON - Configuration and localization files
- SCSS - Stylesheets (compiled to CSS)
- Handlebars - Template language for UI components

## Runtime

**Environment:**
- Chrome/Chromium Browser (Chrome Extensions API)
- Manifest V3 compatible

**Package Manager:**
- npm (with package-lock.json)
- Current project version: 0.11.8

## Frameworks

**Core:**
- Chrome Extensions API (Manifest V3) - Browser extension framework
- jQuery 1.6.1 - DOM manipulation and event handling
- Handlebars 2.0.0 - Template compilation and rendering

**Build/Dev:**
- Grunt 1.6.1 - Task runner and build orchestrator
- Webpack 1.9.4 - Module bundling
- Sass 1.97.3 - CSS preprocessing
- Node 0.5.0 - Browser polyfills for webpack

**Linting:**
- JSHint 3.2.0 - JavaScript static analysis

## Key Dependencies

**Critical:**
- grunt-contrib-handlebars 3.0.0 - Compiles Handlebars templates to JavaScript
- grunt-webpack 1.0.8 - Webpack integration with Grunt
- grunt-contrib-sass 4.0.1 - SCSS compilation to CSS
- grunt-contrib-uglify 5.2.2 - JavaScript minification for releases

**Infrastructure:**
- grunt-contrib-copy 1.0.0 - File copying for build pipeline
- grunt-contrib-concat 2.1.0 - File concatenation (vendor JS)
- grunt-contrib-clean 2.0.1 - Artifact cleanup
- grunt-contrib-compress 2.0.0 - ZIP archive creation for releases
- grunt-bump 0.8.0 - Version management in manifest/package.json
- grunt-changelog 0.3.2 - Changelog generation from git commits
- load-grunt-tasks 5.1.0 - Automatic Grunt task loader
- json-loader 0.5.1 - Webpack JSON loader

**Utility:**
- clean 4.0.1 - File cleanup utility

## Configuration

**Environment:**
- No environment variables required for development
- No .env file used
- Configuration stored in Chrome extension storage API or localStorage

**Build:**
- `Gruntfile.js` - Main build configuration
- `.jshintrc` - JSHint rules (ES5, browser environment, 200 char line limit)
- `webpack` config embedded in Gruntfile (entry points: popup.js, tabWatcher.js, welcome.js)
- Sass configuration for expanded development and compressed release builds

**Version Management:**
- Version bumped in `app/manifest.json` and `package.json` during release
- No git tagging or commits during release (manual workflow)

## Platform Requirements

**Development:**
- Node.js with npm
- Grunt CLI (global)
- Chrome/Chromium browser for testing

**Production:**
- Chrome/Chromium browser (any version supporting Manifest V3)
- Installed as unpacked extension (local installation, not Chrome Web Store)

## Build Artifacts

**Development Build:**
- Output: `build/` directory
- Contains: ES5 code, sourceless stylesheets, copied assets
- Used for: Local testing and watch mode

**Release Build:**
- Output: `build-release/` directory
- Contains: Minified JS, compressed CSS, optimized assets
- ZIP archive: `QuickTab-v[version].zip` and copied to `releases/`

---

*Stack analysis: 2026-01-25*

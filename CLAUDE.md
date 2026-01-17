# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Obsidian community plugin that prettifies URL display in reading view by stripping common prefixes (`https://`, `www.`, `m.`, `amp.`, etc.) from link text. The actual note content remains unchanged.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Development build with watch mode
npm run build        # Production build (type-check + minified bundle)
npm run lint         # Run ESLint
```

## Architecture

Source lives in `src/` and compiles to `main.js` at the project root.

- [main.ts](src/main.ts) - Plugin entry point. Uses `registerMarkdownPostProcessor` to process links in reading view. Handles both markdown links and frontmatter metadata links.
- [settings.ts](src/settings.ts) - Settings interface (`PluginSettings`), defaults (`DEFAULT_SETTINGS`), and the settings tab UI (`MainSettingTab`).

Key patterns:

- Links are identified by CSS selectors
  - `a[href*="://"]` for markdown
  - `.metadata-link-inner[data-href*="://"]` for metadata properties
- Only "URL-only" links are processed (where href equals visible text content)
- The `prettyUrl()` method applies configurable regex replacements

## Testing

Manual testing: copy `main.js`, `manifest.json`, and `styles.css` to `<Vault>/.obsidian/plugins/obsidian-pretty-urls/`, reload Obsidian, and enable the plugin.

## Additional Guidelines

See [AGENTS.md](AGENTS.md) for detailed Obsidian plugin development conventions including manifest rules, versioning, security policies, and coding standards.

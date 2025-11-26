# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**XAgents** is a cross-platform desktop app for centralized management of multiple AI coding tools (VSCode, Cursor, Claude Code, Codex, etc.), including project organization, session tracking, and process monitoring.

### Core Features
- Project management (groups, tags, search)
- One-click tool launching (IDE/CLI)
- Window detection & auto-switching
- Process monitoring (CPU/memory, status sync)
- CLI output parsing (best effort)
- System notifications

### Tech Stack
- **Tauri v2** - Cross-platform desktop framework
- **Next.js 15** (SSG) - Static site generation
- **React 19 RC** + **TypeScript** - Type-safe UI development
- **Tailwind CSS v4** + **shadcn/ui** - Styling & components
- **IndexedDB** + **Dexie.js** - Frontend data persistence
- **Zustand** - State management
- **i18next** - Internationalization
- **Rust** + **sysinfo** - Cross-platform process monitoring

### Architecture Highlights
- **Frontend** IndexedDB data management, no Rust DB code
- **Backend**：System-level ops only (tool launch, window mgmt, process monitor, notifications)
- **Cross-platform**：macOS / Windows / Linux

## Common Commands

```bash
# Development
pnpm dev              # Next.js dev server
pnpm tauri dev        # Tauri desktop app dev mode

# Build
pnpm build            # Build Next.js
pnpm tauri build      # Build Tauri desktop app

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix lint issues
pnpm test             # Run all tests
vitest path/to/file   # Run single test file
```

## Project Structure

- `/app/[locale]/` - Next.js app routes (dynamic locale routing)
  - `globals.css` - Global styles (includes shadcn theme configuration)
  - `/stores/` - State management logic
  - `/sub-page-name/` - Module page directory
    - `/components/` - Module-specific components
    - `/utils/` - Module-specific utilities
    - `/hooks/` - Module-specific hooks
- `/components/` - React components
  - `/ui/` - shadcn/ui component library
  - Root level for global/shared components
- `/docs` - Project documentation
  - `/references` - Reference docs for agents
- `/plugins/i18n/` - i18n configuration and utilities
  - `index.ts` - Server-side translation function
  - `client.ts` - Client-side translation hook
  - `i18next.ts` - i18next configuration
  - `settings.ts` - Language settings
- `/locales/{lang}/` - Translation JSON files
- `/src-tauri/` - Tauri Rust application
- `/hooks/` - React custom hooks
- `/utils/` - Global/shared utility functions
- `/public/` - Static files
- `/scripts/` - Helper scripts

## Core Architecture

### Static Site Generation (SSG)
Project uses static export (`output: 'export'`), required for Tauri integration:
- ❌ **DO NOT use** server runtime APIs (e.g., `headers()`, `cookies()`)
- ✅ **MUST use** `generateStaticParams()` to pre-generate all dynamic routes
- ✅ All routes must be statically generated

## i18n
For internationalization-related issues, see `docs/references/i18n.md`

## Component Development
For component development guidelines, see `docs/references/components.md`

## Development Guidelines

### Git Commits
- Use commitlint + conventional commits
- Husky pre-commit hook automatically runs:
  - ESLint check and auto-fix
  - Vitest runs relevant tests
- Commit format: `type(scope): subject`
  - Types: feat, fix, docs, style, refactor, test, chore, build
  - Example: `feat(i18n): add language switcher component`
- Full commitlint config: see `commitlint.config.ts`

### TypeScript
- Use strict mode
- Avoid using `any`
- Add types for props and function parameters

### Documents management
- Automatically generated documents should be written to the ./tmp/

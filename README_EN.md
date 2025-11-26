# XAgents

[中文版](./README.md)

**XAgents** is a cross-platform desktop application that centralizes multiple AI coding tools (VSCode, Cursor, Claude Code, Codex, etc.) for project organization, session tracking, and process monitoring.

## Why I Built This?

During my daily development work, I frequently need to use different AI tools (Cursor, Claude, VSCode, etc.) across multiple projects simultaneously. Each tool spawns numerous windows, and switching between them often leaves me dizzy and confused—it's hard to quickly locate the project window I'm looking for.

To solve this pain point, I created XAgents, which:
- Centralizes management of all projects and their corresponding tool sessions
- Enables one-click quick switching to any project window
- Monitors the running status of each tool in real-time
- Prevents duplicate opening of the same project

If this tool helps you too, please consider giving it a **Star ⭐️** to show your support!

## Core Features
- **Centralized Project Management**: Create, edit, and delete projects with grouping, tagging, and multi-criteria filtering.
- **One-Click Tool Launch**: Command-level launch plus window switching for VSCode, Cursor, Claude Code, and Codex to avoid duplicate instances.
- **Real-Time Process Monitoring**: Poll CPU/memory, runtime, CLI output, and task progress with instant updates on abnormal exits.
- **Visual Dashboard**: Card-based overview with project status, active sessions, resource usage, and last output summaries.
- **Notifications & Alerts**: Dual delivery via system notifications and in-app prompts for completion, failure, and resource warnings.

## Project Goals
1. Reduce window-management overhead when juggling multiple projects and tools.
2. Deliver a consistent launch and monitoring experience on macOS, Windows, and Linux.
3. Leave room to extend support for additional AI tools and custom automation rules.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## Tech Stack

- **Frontend**: Next.js 15 (SSG) + React 19 + TypeScript + Tailwind CSS v4
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: Zustand
- **Data Storage**: IndexedDB (Dexie.js)
- **i18n**: i18next
- **Desktop Framework**: Tauri v2
- **Backend**: Rust + sysinfo (process monitoring)

## Development Guide

### Prerequisites

Refer to the [Tauri v2 prerequisites](https://v2.tauri.app/zh-cn/start/prerequisites/) and ensure:

- **Common Dependencies**: Node.js ≥ 18, pnpm ≥ 8, stable Rust (via `rustup`), and a system WebView runtime.
- **macOS**: Install Xcode Command Line Tools, preferably install `rustup`/`pnpm` with Homebrew, and enable `codesign`.
- **Windows**: Install Visual Studio 2022 Build Tools (with the "Desktop development with C++" workload), WebView2 Runtime, and enable Developer Mode for MSIX sideloading.
- **Linux**: glibc ≥ 2.28, `pkg-config`, `libssl-dev`, plus distro packages such as `webkit2gtk`/`webkitgtk`, `openssl`, and `dbus`.

Run `pnpm tauri info` to verify the environment quickly.

### Install Dependencies

```bash
pnpm i
```

This installs frontend packages along with `@tauri-apps/cli`, `@tauri-apps/api`, and other desktop components—no extra global install required.

### Develop & Debug

1. Start the dev workflow:
    ```bash
    pnpm tauri dev
    ```
    This runs the frontend builder and Tauri backend together, automatically rebuilding on source changes (see the [Develop guide](https://v2.tauri.app/develop/)).
2. Use `pnpm tauri dev -- --config-file src-tauri/tauri.conf.json` for custom configs, or set `TAURI_DEVTOOLS=1` to open the devtools.
3. In CI, combine `pnpm tauri info` with `pnpm tauri driver` to run integration tests.

### Distribute

Follow the [Distribute guide](https://v2.tauri.app/distribute/) to produce installers for every platform:

```bash
pnpm tauri build
```

- Outputs dmg/msi/msix/AppImage bundles in `src-tauri/target/release/bundle/`.
- For signing:
  - macOS: `codesign` / `notarytool`
  - Windows: `signtool` or `pnpm tauri signer sign --certificate <path>`
  - Linux: Sign AppImages/archives with GPG
- Verify bundles with `pnpm tauri signer verify <bundle>` before uploading to stores or release pages.

Update `src-tauri/tauri.conf.json` for custom icons, identifiers, or multi-arch builds, then rerun `pnpm tauri build`.

## Notes

- **Testing Platform**: All features have been tested and verified only on **macOS**. I primarily use Mac for development, and I don't have immediate access to other platforms, so they're on hold for now.
- **CLI Window Focus**: The window focus functionality for CLI tools has been tested only with **iTerm2**. While the code includes support for other terminals like Terminal.app and Warp, I haven't tested them yet since I don't use them personally.
- If you need support for other platforms or encounter any difficulties, feel free to fork the project, submit a PR, or reach out to me directly~

## License

MIT License

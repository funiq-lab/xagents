# XAgents

[English Version](./README_EN.md)

**XAgents** 是一个跨平台桌面应用，用于集中管理多个 AI 编程工具（VSCode、Cursor、Claude Code、Codex 等），包括项目组织、会话跟踪和进程监控。

## 为什么创建这个项目？

在日常开发中，经常需要同时使用不同的 AI 工具（Cursor、VSCode、Claude Code、 Codex 等）开发多个项目，每个工具都会开启大量窗口。在这些窗口之间来回切换时，经常会感到头晕和混乱，大家应该都懂😒。

为了解决这个痛点，我开发了 XAgents，它可以：
- 集中管理所有项目和对应的工具会话
- 一键快速切换到指定项目的窗口
- 实时监控各个工具的运行状态
- 避免重复打开同一个项目

如果这个工具对你也有帮助，欢迎 **点个 Star ⭐️** 支持一下！

## 核心功能
- **项目集中管理**：创建、编辑、删除项目，支持分组与标签归类，并可按多条件组合筛选。
- **工具一键启动**：针对VSCode、Cursor、Claude Code、Codex提供命令级启动与窗口切换逻辑，避免重复打开实例。
- **实时进程监控**：轮询获取CPU/内存、运行时长、CLI输出与任务进度，异常退出即时同步。
- **可视化Dashboard**：以卡片视图展示项目概况、活跃会话、资源占用及最后输出摘要。
- **通知与告警**：任务完成、失败与资源告警通过系统通知与应用内提示双通道发送。

## 项目目标
1. 降低多项目、多工具并行开发的窗口管理成本。
2. 在macOS、Windows、Linux上提供一致的启动与监控体验。
3. 为未来扩展更多AI工具与自定义规则预留接口。

## 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新历史。

## 技术栈

- **前端**: Next.js 15 (SSG) + React 19 + TypeScript + Tailwind CSS v4
- **UI组件**: shadcn/ui + Radix UI
- **状态管理**: Zustand
- **数据存储**: IndexedDB (Dexie.js)
- **国际化**: i18next
- **桌面框架**: Tauri v2
- **后端**: Rust + sysinfo (进程监控)

## 开发指南

### 前置要求

参考 [Tauri v2 前置要求](https://v2.tauri.app/zh-cn/start/prerequisites/)，请确保：

- **通用依赖**：Node.js ≥ 18、pnpm ≥ 8、Rust 稳定版（通过 `rustup`）、系统 WebView 运行时。
- **macOS**：安装 Xcode Command Line Tools，建议通过 Homebrew 安装 `rustup`、`pnpm`，并启用 `codesign`。
- **Windows**：安装 Visual Studio 2022 Build Tools（带「桌面开发（C++）」工作负载）、WebView2 Runtime、启用开发者模式以便 sideload MSIX。
- **Linux**：glibc ≥ 2.28，`pkg-config`、`libssl-dev` 等构建依赖；基于发行版安装 `webkit2gtk`/`webkitgtk`、`openssl`、`dbus` 等包。

使用 `pnpm tauri info` 可快速检查环境是否满足要求。

### 安装依赖

```bash
pnpm i
```

该命令会安装前端依赖及 `@tauri-apps/cli`、`@tauri-apps/api` 等桌面端组件，无需额外全局安装。

### 开发与调试

1. 启动开发模式：
    ```bash
    pnpm tauri dev
    ```
    该命令会同时运行前端构建与 Tauri 后端，并在检测到源文件变更时自动重新打包（参考 [Develop 指南](https://v2.tauri.app/develop/)）。
2. 可通过 `pnpm tauri dev -- --config-file src-tauri/tauri.conf.json` 指定自定义配置，或设置 `TAURI_DEVTOOLS=1` 打开开发者工具。
3. 若需在 CI 中验证，可结合 `pnpm tauri info` / `pnpm tauri driver` 脚本执行集成测试。

### 发布与分发

依据 [Distribute 指南](https://v2.tauri.app/distribute/)，使用以下流程生成各平台安装包：

```bash
pnpm tauri build
```

- 该命令会产出 dmg/msi/msix/AppImage 等制品，输出位于 `src-tauri/target/release/bundle/`。
- 若需要签名：
  - macOS 使用 `codesign`/`notarytool`；
  - Windows 使用 `signtool` 或 `pnpm tauri signer sign --certificate <path>`；
  - Linux 可使用 GPG 对 AppImage/压缩包进行签名。
- 通过 `pnpm tauri signer verify <bundle>` 校验签名后，即可上传到应用商店或发布页。

如需自定义图标、应用标识或多架构构建，请更新 `src-tauri/tauri.conf.json` 并重新执行 `pnpm tauri build`。

## 备注

- **测试平台**：当前功能仅在 **macOS** 上完成测试验证，平时主要都是用mac开发，其他的平台暂时我用不上，所以先搁置啦。
- **CLI 窗口聚焦**：命令行工具的窗口聚焦功能目前只在 **iTerm2** 上完成测试。虽然代码中已实现 Terminal.app、Warp 等其他终端的支持，但由于个人暂时用不上，尚未进行实际测试验证。
- 如果有其他平台使用者有需要，或者使用上遇到困难，欢迎自行fork项目修改、提交pr或者直接跟我沟通～
- 不发布Release包了，有需要的话自行在自己的平台build吧

## 许可证

MIT License

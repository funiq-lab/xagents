# 更新日志

## 0.1.1 · 2025-11-28

### 🐛 修复
- **窗口 PID 获取回退方案**：修复 `--status` 命令获取窗口进程 ID 不稳定的问题
  - 增加 `find_ide_main_process()` 函数，在无法获取窗口 PID 时回退到主进程 PID
  - 添加 `hasWindowPid` 标志，区分窗口进程和主进程
  - 前端根据标志条件性注册进程监控和显示 CPU/Memory 指标
  - 回退模式下隐藏资源监控，仅提供窗口跳转功能
  - UI 提示用户"仅跳转"状态，提升用户体验

### 🛠 改进
- **进程监控优化**：只有在获取到精确窗口 PID 时才注册进程监控
- **用户提示增强**：在无法获取窗口 PID 时显示 Toast 通知和内联提示
- **数据结构完善**：
  - `CliLaunchResult` 添加 `has_window_pid` 字段
  - `ProcessSession` 添加 `hasWindowPid` 字段
  - `CreateSessionInput` 添加 `hasWindowPid` 字段

---

## 0.1.0 · 2025-11-26

### 🐛 修复
- **生产环境 IDE 启动**：修复在生产环境中无法通过 `code` 和 `cursor` 命令启动 IDE 的问题
  - 增加 `open -a` 命令回退机制，确保在 PATH 环境变量缺失时也能正常启动
  - 在 `get_ide_window_pid` 中增加完整路径尝试（如 `/usr/local/bin/code`）
- **日志系统**：新增文件日志系统，替换所有 `println!` 为 `log::info!` 等宏
  - 日志输出到 `~/Library/Application Support/com.yellin.xagents/logs/xagents.log`
  - 实现日志文件大小限制（10MB），超限自动截断
  - 日志格式：`时间戳 [日志级别] 消息内容`

### 🚀 新增
- **项目工作台**：按照项目分组、打标签、支持快速搜索。
- **一键拉起工具**：IDE 与 CLI 助手均可带上项目路径启动，VSCode/Cursor 支持深度链接。
- **会话追踪**：注册、监控、重新聚焦运行中的工具会话，避免同时开发多个项目时的会话管理难度。
- **进程监控**：Rust `sysinfo` 后端实时汇报 CPU/内存并侦测孤儿进程。
- **多语言 UI**：i18next实现，当前提供中文与英文动态路由。
- **持久化**：tauri store 持久化

### 🛠 改进
- **窗口管理 API**：`focus_window_by_pid` 根据工具类型选择聚焦策略并提供回退逻辑。
- **启动流程**：CLI/IDE 在可复用窗口时直接聚焦并在程序中提示。
- **状态与存储**：统一使用 Zustand、Tauri store 与 shadcn/ui，方便扩展新模块。

### ⚠️ 测试范围与限制
- CLI 窗口聚焦仅在 **iTerm2** 上验证，其他终端仍需后续测试适配。
- 全量功能当前只在 **macOS** 平台完成测试。

/**
 * Tool type: IDE or CLI
 */
export type ToolType = 'ide' | 'cli'

/**
 * Platform types
 */
export type Platform = 'macos' | 'windows' | 'linux'

/**
 * Built-in IDE tool (VSCode, Cursor)
 * - Always launched via command line
 * - Can get window PID via --status command
 * - Support resource monitoring
 */
export interface BuiltinIdeTool {
  id: 'vscode' | 'cursor'
  label: string
  command: string // e.g., 'code', 'cursor'
  icon?: string
}

/**
 * Built-in AI CLI tool (Claude Code, Codex, Gemini)
 * - Launched via terminal with specific command
 * - Process found by project path matching
 * - Support resource monitoring when process is found
 */
export interface BuiltinAiCliTool {
  id: 'claude' | 'codex' | 'gemini'
  label: string
  command: string // e.g., 'claude', 'codex', 'gemini'
  processName: string // Process name to search for
  icon?: string
}

/**
 * Built-in CLI tool configuration
 * - macOS: Use AppleScript to launch
 * - Windows/Linux: Use command line
 * - Cannot monitor resources (no stable PID)
 */
export interface BuiltinCliTool {
  id: string
  label: string
  platform: Platform[]
  /**
   * macOS: App name for AppleScript
   */
  appName?: string
  /**
   * Windows/Linux: Command to execute
   */
  command?: string
}

/**
 * Launch config sent to Rust backend
 */
export interface ToolLaunchConfig {
  id: string
  type: ToolType
  command: string
  displayName: string
  /**
   * Launch method:
   * - 'command': Direct shell command (for IDEs and non-macOS CLI)
   * - 'applescript': macOS AppleScript (for macOS CLI tools)
   */
  launchMethod: 'command' | 'applescript'
}

/**
 * Launch result from Rust
 */
export interface LaunchResult {
  startTime: number // Unix timestamp
  pid?: number // Only for IDEs with window PID tracking
  isExistingWindow: boolean // True if window already existed and was focused
}

// ============ Built-in Tool Definitions ============

/**
 * Supported IDE tools (cross-platform)
 */
export const BUILTIN_IDE_TOOLS: BuiltinIdeTool[] = [
  {
    id: 'vscode',
    label: 'VSCode',
    command: 'code',
    icon: 'vscode',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    command: 'cursor',
    icon: 'cursor',
  },
]

/**
 * Supported AI CLI tools (cross-platform)
 * These tools are launched via terminal and auto-execute commands
 */
export const BUILTIN_AI_CLI_TOOLS: BuiltinAiCliTool[] = [
  {
    id: 'claude',
    label: 'Claude Code',
    command: 'claude',
    processName: 'claude',
    icon: 'claude',
  },
  {
    id: 'codex',
    label: 'Codex',
    command: 'codex',
    processName: 'codex',
    icon: 'codex',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    command: 'gemini',
    processName: 'gemini',
    icon: 'gemini',
  },
]

/**
 * Supported CLI tools by platform
 */
export const BUILTIN_CLI_TOOLS: BuiltinCliTool[] = [
  // macOS CLI tools
  {
    id: 'terminal',
    label: 'Terminal',
    platform: ['macos'],
    appName: 'Terminal',
  },
  {
    id: 'iterm2',
    label: 'iTerm2',
    platform: ['macos'],
    appName: 'iTerm',
  },
  {
    id: 'warp',
    label: 'Warp',
    platform: ['macos'],
    appName: 'Warp',
  },
  // Windows CLI tool
  {
    id: 'cmd',
    label: 'Command Prompt',
    platform: ['windows'],
    command: 'start cmd /K "cd /d {path}"',
  },
  {
    id: 'powershell',
    label: 'PowerShell',
    platform: ['windows'],
    command: 'start powershell -NoExit -Command "cd \'{path}\'"',
  },
  // Linux CLI tool
  {
    id: 'gnome-terminal',
    label: 'GNOME Terminal',
    platform: ['linux'],
    command: 'gnome-terminal --working-directory="{path}"',
  },
]

/**
 * Get CLI tools available for current platform
 */
export function getAvailableCliTools(platform: Platform): BuiltinCliTool[] {
  return BUILTIN_CLI_TOOLS.filter(tool => tool.platform.includes(platform))
}

/**
 * Get default CLI tool for platform
 */
export function getDefaultCliTool(platform: Platform): BuiltinCliTool | undefined {
  const available = getAvailableCliTools(platform)
  if (available.length === 0)
    return undefined

  // Return first available tool as default
  return available[0]
}

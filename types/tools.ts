export type ToolType = 'ide' | 'cli'

export type ToolPlatform = 'macos' | 'windows' | 'linux'

export interface ToolLaunchConfig {
  id: string
  label: string
  type: ToolType
  /**
   * Launch command template. Supports `{path}` placeholder for the project directory.
   */
  command: string
  /**
   * Display name used for macOS window detection/focus.
   */
  displayName: string
  /**
   * Process name used for Windows/Linux detection and resource tracking.
   */
  processName: string
}

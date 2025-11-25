import type { BuiltinCliTool, BuiltinIdeTool, Platform, ToolLaunchConfig } from '@/types/tools'

/**
 * Detect current platform
 */
export function detectPlatform(): Platform {
  if (typeof window === 'undefined') {
    // Server-side: use Node.js process.platform
    const platform = process.platform
    if (platform === 'darwin')
      return 'macos'
    if (platform === 'win32')
      return 'windows'
    return 'linux'
  }

  // Client-side: detect from user agent
  const ua = window.navigator.userAgent.toLowerCase()
  if (ua.includes('mac'))
    return 'macos'
  if (ua.includes('win'))
    return 'windows'
  return 'linux'
}

/**
 * Convert IDE tool to launch config
 */
export function ideToLaunchConfig(ide: BuiltinIdeTool, projectPath: string): ToolLaunchConfig {
  return {
    id: ide.id,
    type: 'ide',
    command: `${ide.command} "${projectPath}"`,
    displayName: ide.label,
    launchMethod: 'command',
  }
}

/**
 * Convert CLI tool to launch config
 */
export function cliToLaunchConfig(
  cli: BuiltinCliTool,
  projectPath: string,
  platform: Platform = detectPlatform(),
): ToolLaunchConfig {
  // macOS: Use AppleScript
  if (platform === 'macos' && cli.appName) {
    return {
      id: cli.id,
      type: 'cli',
      command: cli.appName, // For AppleScript, command is the app name
      displayName: cli.label,
      launchMethod: 'applescript',
    }
  }

  // Windows/Linux: Use shell command
  const command = cli.command?.replace('{path}', projectPath) || ''
  return {
    id: cli.id,
    type: 'cli',
    command,
    displayName: cli.label,
    launchMethod: 'command',
  }
}

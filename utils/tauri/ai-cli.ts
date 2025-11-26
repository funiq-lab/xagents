import type { LaunchResult } from './types'
import type { BuiltinAiCliTool, BuiltinCliTool, Platform, ToolLaunchConfig } from '@/types/tools'
import { invoke } from '@tauri-apps/api/core'
import { detectPlatform } from '@/utils/tools'

/**
 * Launch AI CLI tool with auto-execution
 *
 * This function launches the selected terminal tool and automatically
 * executes the AI CLI command (claude, codex, or gemini)
 */
export async function launchAiCLI(
  aiTool: BuiltinAiCliTool,
  selectedTerminal: BuiltinCliTool,
  projectPath: string,
  platform: Platform = detectPlatform(),
): Promise<LaunchResult> {
  // Build launch config for terminal with AI command
  const config: ToolLaunchConfig = {
    id: selectedTerminal.id,
    type: 'cli',
    command: selectedTerminal.appName || selectedTerminal.command || '',
    displayName: aiTool.command, // Pass AI tool command in displayName for auto-execution
    launchMethod: platform === 'macos' && selectedTerminal.appName ? 'applescript' : 'command',
  }

  return await invoke<LaunchResult>('launch_tool', {
    toolConfig: config,
    projectPath,
  })
}

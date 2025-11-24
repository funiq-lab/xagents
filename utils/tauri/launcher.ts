import type { LaunchResult, ToolLaunchConfig } from './types'
import { invoke } from '@tauri-apps/api/core'

/**
 * Launch tool (IDE/CLI) with provided configuration.
 */
export async function launchTool(
  toolConfig: ToolLaunchConfig,
  projectPath: string,
): Promise<LaunchResult> {
  return await invoke<LaunchResult>('launch_tool', {
    toolConfig,
    projectPath,
  })
}

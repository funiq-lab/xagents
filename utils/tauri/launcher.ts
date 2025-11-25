import type { LaunchResult, ToolLaunchConfig } from './types'
import type { BuiltinIdeTool } from '@/types/tools'
import { invoke } from '@tauri-apps/api/core'
import { ideToLaunchConfig } from '@/utils/tools'

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

/**
 * Launch IDE tool
 */
export async function launchIDE(
  ide: BuiltinIdeTool,
  projectPath: string,
): Promise<LaunchResult> {
  const config = ideToLaunchConfig(ide, projectPath)
  return await launchTool(config, projectPath)
}

import type { ToolLaunchConfig } from './types'
import { invoke } from '@tauri-apps/api/core'

/**
 * check window exists
 */
export async function checkWindowExists(
  toolConfig: ToolLaunchConfig,
  projectPath: string,
): Promise<boolean> {
  return await invoke<boolean>('check_window_exists', {
    toolConfig,
    projectPath,
  })
}

/**
 * forcus window
 */
export async function focusWindow(toolConfig: ToolLaunchConfig, projectPath: string): Promise<void> {
  return await invoke<void>('focus_window', {
    toolConfig,
    projectPath,
  })
}

import { invoke } from '@tauri-apps/api/core'

/**
 * Focus window by process ID and tool type
 *
 * This function brings the window associated with the given PID to the foreground.
 * It works for both IDE windows and CLI terminal windows.
 *
 * @param pid - Process ID of the window to focus
 * @param toolType - Type of tool: "ide" for IDE windows, "cli" for CLI terminal windows
 * @param toolId - IDE identifier (e.g., "vscode", "cursor")
 * @param projectPath - Project path, used for IDE windows
 * @throws Error if window focusing fails
 */
export async function focusWindowByPid(
  pid: number,
  toolType: 'ide' | 'cli',
  toolId: string,
  projectPath: string,
): Promise<void> {
  try {
    await invoke('focus_window_by_pid', { pid, toolType, ideId: toolId, projectPath })
  }
  catch (error) {
    console.error('[window] Failed to focus window:', error)
    throw error
  }
}

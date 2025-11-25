import { invoke } from '@tauri-apps/api/core'

export interface DirectoryDialogOptions {
  title?: string
  defaultPath?: string
}

/**
 * Open a native directory picker dialog.
 */
export async function selectDirectory(
  options?: DirectoryDialogOptions,
): Promise<string | null> {
  return await invoke<string | null>('select_directory', {
    options,
  })
}

/**
 * List first-level subdirectories for a given root path.
 */
export async function listSubdirectories(rootPath: string): Promise<string[]> {
  return await invoke<string[]>('list_subdirectories', {
    rootPath,
  })
}

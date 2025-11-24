import type { ProcessStatus } from './types'
import { invoke } from '@tauri-apps/api/core'

/**
 * get process status
 */
export async function getProcessStatus(
  pid: number,
  expectedStartTime: number,
): Promise<ProcessStatus> {
  return await invoke<ProcessStatus>('get_process_status', {
    pid,
    expectedStartTime,
  })
}

/**
 * kill process
 */
export async function killProcess(pid: number): Promise<void> {
  return await invoke<void>('kill_process', {
    pid,
  })
}

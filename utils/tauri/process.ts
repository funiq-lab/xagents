import type { ProcessStatus } from './types'
import { invoke } from '@tauri-apps/api/core'

/**
 * Register a session to the process monitor
 */
export async function registerSession(
  pid: number,
  startTime: number,
): Promise<void> {
  return await invoke<void>('register_session', {
    pid,
    startTime,
  })
}

/**
 * Unregister a session from the process monitor
 */
export async function unregisterSession(pid: number): Promise<void> {
  return await invoke<void>('unregister_session', {
    pid,
  })
}

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

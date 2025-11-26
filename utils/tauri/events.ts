import type {
  ProcessStatusChangedEvent,
  ResourceUpdateEvent,
} from './types'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

/**
 * Listen for resource update events
 */
export async function listenResourceUpdate(
  callback: (event: ResourceUpdateEvent) => void,
): Promise<UnlistenFn> {
  return await listen<ResourceUpdateEvent>('resource-update', (event) => {
    callback(event.payload)
  })
}

/**
 * Listen for process status changed events
 */
export async function listenProcessStatusChanged(
  callback: (event: ProcessStatusChangedEvent) => void,
): Promise<UnlistenFn> {
  return await listen<ProcessStatusChangedEvent>('process-status-changed', (event) => {
    callback(event.payload)
  })
}

/**
 * Listens to all relevant events and returns unlisten functions
 */
export async function setupEventListeners(handlers: {
  onResourceUpdate?: (event: ResourceUpdateEvent) => void
  onProcessStatusChanged?: (event: ProcessStatusChangedEvent) => void
}): Promise<UnlistenFn[]> {
  const unlisteners: UnlistenFn[] = []

  if (handlers.onResourceUpdate) {
    unlisteners.push(await listenResourceUpdate(handlers.onResourceUpdate))
  }

  if (handlers.onProcessStatusChanged) {
    unlisteners.push(await listenProcessStatusChanged(handlers.onProcessStatusChanged))
  }

  return unlisteners
}

/**
 * cancel all event listeners
 */
export function cleanupEventListeners(unlisteners: UnlistenFn[]): void {
  unlisteners.forEach(unlisten => unlisten())
}

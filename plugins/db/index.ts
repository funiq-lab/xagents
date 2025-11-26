'use client'

import { loadState, resetState } from './store'

export * from './operations/groups'
export * from './operations/projects'
export * from './operations/sessions'
export * from './operations/settings'
export * from './operations/tags'
export * from './operations/toolConfigs'
export type {
  ClaudeConfig,
  CodexConfig,
  GeminiConfig,
  Group,
  NotificationConfig,
  ProcessSession,
  Project,
  Settings,
  Tag,
  ToolConfigType,
} from './schema'
export type { Platform, ToolLaunchConfig, ToolType } from '@/types/tools'

let isInitialized = false

export async function initializeDatabase(): Promise<void> {
  if (isInitialized)
    return

  await loadState()
  isInitialized = true
}

export async function resetDatabase(): Promise<void> {
  await resetState()
  isInitialized = false
  await initializeDatabase()
}

import { getAvailableCliTools, getDefaultCliTool, type Platform } from '@/types/tools'
import { db, type NotificationConfig } from '../schema'

const SELECTED_CLI_TOOL_KEY = 'selected_cli_tool'

// ============ Platform detection ============

function detectPlatform(): Platform {
  if (typeof navigator !== 'undefined') {
    const agent = navigator.userAgent.toLowerCase()
    if (agent.includes('mac'))
      return 'macos'
    if (agent.includes('win'))
      return 'windows'
    if (agent.includes('linux'))
      return 'linux'
  }

  if (typeof process !== 'undefined') {
    switch (process.platform) {
      case 'darwin':
        return 'macos'
      case 'win32':
        return 'windows'
      default:
        return 'linux'
    }
  }

  return 'macos'
}

export function getToolPlatform(): Platform {
  return detectPlatform()
}

// ============ CLI Tool Selection ============

/**
 * Get selected CLI tool ID for current platform
 */
export async function getSelectedCliToolId(platform: Platform = detectPlatform()): Promise<string | undefined> {
  const key = `${SELECTED_CLI_TOOL_KEY}_${platform}`
  const setting = await db.settings.get(key)
  return setting?.value as string | undefined
}

/**
 * Set selected CLI tool ID for current platform
 */
export async function setSelectedCliToolId(toolId: string, platform: Platform = detectPlatform()): Promise<void> {
  const key = `${SELECTED_CLI_TOOL_KEY}_${platform}`
  await db.settings.put({
    key,
    value: toolId,
    updatedAt: Date.now(),
  })
}

/**
 * Get the currently selected CLI tool, with fallback to default
 */
export async function getSelectedCliTool(platform: Platform = detectPlatform()) {
  const selectedId = await getSelectedCliToolId(platform)
  const availableTools = getAvailableCliTools(platform)

  // Find the selected tool
  if (selectedId) {
    const tool = availableTools.find(t => t.id === selectedId)
    if (tool)
      return tool
  }

  // Fallback to default tool
  return getDefaultCliTool(platform)
}

// ============ Notification configuration ============

const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  enabled: true,
  taskComplete: true,
  taskFailed: true,
  resourceAlert: false,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
}

export async function getNotificationConfig(): Promise<NotificationConfig> {
  const setting = await db.settings.get('notification_config')
  return (setting?.value as NotificationConfig) || DEFAULT_NOTIFICATION_CONFIG
}

export async function saveNotificationConfig(config: NotificationConfig): Promise<void> {
  await db.settings.put({
    key: 'notification_config',
    value: config,
    updatedAt: Date.now(),
  })
}

// ============ Generic settings helpers ============

export async function getSetting<T = unknown>(key: string): Promise<T | undefined> {
  const setting = await db.settings.get(key)
  return setting?.value as T | undefined
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  await db.settings.put({
    key,
    value,
    updatedAt: Date.now(),
  })
}

export async function deleteSetting(key: string): Promise<void> {
  await db.settings.delete(key)
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const settings = await db.settings.toArray()
  return settings.reduce(
    (acc, s) => {
      acc[s.key] = s.value
      return acc
    },
    {} as Record<string, unknown>,
  )
}

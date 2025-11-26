import type { NotificationConfig } from '../schema'
import { getAvailableCliTools, getDefaultCliTool, type Platform } from '@/types/tools'
import { loadState, mutateState } from '../store'

const SELECTED_CLI_TOOL_KEY = 'selected_cli_tool'

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

async function getSettingRecord(key: string) {
  const state = await loadState()
  return state.settings.find(setting => setting.key === key)
}

async function upsertSetting(key: string, value: unknown): Promise<void> {
  await mutateState((state) => {
    const existing = state.settings.find(setting => setting.key === key)
    if (existing) {
      existing.value = value
      existing.updatedAt = Date.now()
    }
    else {
      state.settings.push({
        key,
        value,
        updatedAt: Date.now(),
      })
    }
  })
}

export async function getSelectedCliToolId(platform: Platform = detectPlatform()): Promise<string | undefined> {
  const key = `${SELECTED_CLI_TOOL_KEY}_${platform}`
  const record = await getSettingRecord(key)
  return record?.value as string | undefined
}

export async function setSelectedCliToolId(toolId: string, platform: Platform = detectPlatform()): Promise<void> {
  const key = `${SELECTED_CLI_TOOL_KEY}_${platform}`
  await upsertSetting(key, toolId)
}

export async function getSelectedCliTool(platform: Platform = detectPlatform()) {
  const selectedId = await getSelectedCliToolId(platform)
  const availableTools = getAvailableCliTools(platform)

  if (selectedId) {
    const tool = availableTools.find(item => item.id === selectedId)
    if (tool)
      return tool
  }

  return getDefaultCliTool(platform)
}

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
  const record = await getSettingRecord('notification_config')
  return (record?.value as NotificationConfig) || DEFAULT_NOTIFICATION_CONFIG
}

export async function saveNotificationConfig(config: NotificationConfig): Promise<void> {
  await upsertSetting('notification_config', config)
}

export async function getSetting<T = unknown>(key: string): Promise<T | undefined> {
  const record = await getSettingRecord(key)
  return record?.value as T | undefined
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  await upsertSetting(key, value)
}

export async function deleteSetting(key: string): Promise<void> {
  await mutateState((state) => {
    state.settings = state.settings.filter(setting => setting.key !== key)
  })
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const state = await loadState()
  return state.settings.reduce<Record<string, unknown>>((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {})
}

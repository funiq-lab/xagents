import type { ToolLaunchConfig, ToolPlatform } from '@/types/tools'
import { db, type NotificationConfig } from '../schema'

const TOOL_CONFIG_KEY_PREFIX = 'tool_configs'

const MAC_TERMINAL_TEMPLATE = 'open -a "iTerm2" --args --working-directory "{path}" -e "{command}"'
const WINDOWS_TERMINAL_TEMPLATE = 'start cmd /k "cd /d {path} && {command}"'
const LINUX_TERMINAL_TEMPLATE = 'gnome-terminal -- bash -c \'cd "{path}" && {command}; exec bash\''

const DEFAULT_TOOL_CONFIGS: Record<ToolPlatform, ToolLaunchConfig[]> = {
  macos: [
    {
      id: 'vscode',
      label: 'VSCode',
      type: 'ide',
      command: 'open -a "Visual Studio Code" "{path}"',
      displayName: 'Visual Studio Code',
      processName: 'Code',
    },
    {
      id: 'cursor',
      label: 'Cursor',
      type: 'ide',
      command: 'open -a "Cursor" "{path}"',
      displayName: 'Cursor',
      processName: 'Cursor',
    },
    {
      id: 'claude-code',
      label: 'Claude Code',
      type: 'cli',
      command: MAC_TERMINAL_TEMPLATE.replace('{command}', 'claude'),
      displayName: 'iTerm',
      processName: 'claude',
    },
    {
      id: 'codex',
      label: 'Codex',
      type: 'cli',
      command: MAC_TERMINAL_TEMPLATE.replace('{command}', 'codex'),
      displayName: 'iTerm',
      processName: 'codex',
    },
    {
      id: 'gemini',
      label: 'Gemini',
      type: 'cli',
      command: MAC_TERMINAL_TEMPLATE.replace('{command}', 'gemini'),
      displayName: 'iTerm',
      processName: 'gemini',
    },
  ],
  windows: [
    {
      id: 'vscode',
      label: 'VSCode',
      type: 'ide',
      command: 'code "{path}"',
      displayName: 'Visual Studio Code',
      processName: 'Code.exe',
    },
    {
      id: 'cursor',
      label: 'Cursor',
      type: 'ide',
      command: 'cursor "{path}"',
      displayName: 'Cursor',
      processName: 'Cursor.exe',
    },
    {
      id: 'claude-code',
      label: 'Claude Code',
      type: 'cli',
      command: WINDOWS_TERMINAL_TEMPLATE.replace('{command}', 'claude'),
      displayName: 'Windows Terminal',
      processName: 'claude.exe',
    },
    {
      id: 'codex',
      label: 'Codex',
      type: 'cli',
      command: WINDOWS_TERMINAL_TEMPLATE.replace('{command}', 'codex'),
      displayName: 'Windows Terminal',
      processName: 'codex.exe',
    },
    {
      id: 'gemini',
      label: 'Gemini',
      type: 'cli',
      command: WINDOWS_TERMINAL_TEMPLATE.replace('{command}', 'gemini'),
      displayName: 'Windows Terminal',
      processName: 'gemini.exe',
    },
  ],
  linux: [
    {
      id: 'vscode',
      label: 'VSCode',
      type: 'ide',
      command: 'code "{path}"',
      displayName: 'VSCode',
      processName: 'code',
    },
    {
      id: 'cursor',
      label: 'Cursor',
      type: 'ide',
      command: 'cursor "{path}"',
      displayName: 'Cursor',
      processName: 'cursor',
    },
    {
      id: 'claude-code',
      label: 'Claude Code',
      type: 'cli',
      command: LINUX_TERMINAL_TEMPLATE.replace('{command}', 'claude'),
      displayName: 'Terminal',
      processName: 'claude',
    },
    {
      id: 'codex',
      label: 'Codex',
      type: 'cli',
      command: LINUX_TERMINAL_TEMPLATE.replace('{command}', 'codex'),
      displayName: 'Terminal',
      processName: 'codex',
    },
    {
      id: 'gemini',
      label: 'Gemini',
      type: 'cli',
      command: LINUX_TERMINAL_TEMPLATE.replace('{command}', 'gemini'),
      displayName: 'Terminal',
      processName: 'gemini',
    },
  ],
}

function cloneToolConfigs(configs: ToolLaunchConfig[]): ToolLaunchConfig[] {
  return configs.map(config => ({ ...config }))
}

function detectPlatform(): ToolPlatform {
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

function getToolConfigKey(platform: ToolPlatform): string {
  return `${TOOL_CONFIG_KEY_PREFIX}_${platform}`
}

export function getToolPlatform(): ToolPlatform {
  return detectPlatform()
}

export async function getToolConfigs(platform = detectPlatform()): Promise<ToolLaunchConfig[]> {
  const setting = await db.settings.get(getToolConfigKey(platform))
  const stored = setting?.value as ToolLaunchConfig[] | undefined
  if (stored && stored.length > 0)
    return cloneToolConfigs(stored)
  return cloneToolConfigs(DEFAULT_TOOL_CONFIGS[platform])
}

export async function saveToolConfigs(
  configs: ToolLaunchConfig[],
  platform = detectPlatform(),
): Promise<void> {
  await db.settings.put({
    key: getToolConfigKey(platform),
    value: configs,
    updatedAt: Date.now(),
  })
}

export async function resetToolConfigs(platform = detectPlatform()): Promise<ToolLaunchConfig[]> {
  await db.settings.delete(getToolConfigKey(platform))
  return cloneToolConfigs(DEFAULT_TOOL_CONFIGS[platform])
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

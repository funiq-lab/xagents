import type { ToolLaunchConfig, ToolPlatform } from '@/types/tools'
import { create } from 'zustand'
import {
  getNotificationConfig,
  getToolConfigs,
  getToolPlatform,
  type NotificationConfig,
  resetToolConfigs,
  saveNotificationConfig,
  saveToolConfigs,
} from '../db'

export interface SettingsStore {
  // Tool configuration
  toolConfigs: ToolLaunchConfig[]
  toolPlatform: ToolPlatform

  // Notification configuration
  notificationConfig: NotificationConfig | null

  // Loading state
  isLoading: boolean

  // Tool configuration methods
  loadToolConfigs: () => Promise<void>
  updateToolConfigs: (configs: ToolLaunchConfig[]) => Promise<void>
  resetToolConfigs: () => Promise<ToolLaunchConfig[]>

  // Notification configuration methods
  loadNotificationConfig: () => Promise<void>
  updateNotificationConfig: (config: NotificationConfig) => Promise<void>

  // Initialize store
  initialize: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  toolConfigs: [],
  toolPlatform: getToolPlatform(),
  notificationConfig: null,
  isLoading: false,

  // ============ Tool configuration ============

  loadToolConfigs: async () => {
    try {
      const platform = get().toolPlatform || getToolPlatform()
      const configs = await getToolConfigs(platform)
      set({ toolConfigs: configs, toolPlatform: platform })
    }
    catch (error) {
      console.error('[SettingsStore] Load tool configs failed:', error)
    }
  },

  updateToolConfigs: async (configs) => {
    const platform = get().toolPlatform || getToolPlatform()
    await saveToolConfigs(configs, platform)
    set({ toolConfigs: configs, toolPlatform: platform })
  },

  resetToolConfigs: async () => {
    const platform = get().toolPlatform || getToolPlatform()
    const defaults = await resetToolConfigs(platform)
    set({ toolConfigs: defaults, toolPlatform: platform })
    return defaults
  },

  // ============ Notification configuration ============

  loadNotificationConfig: async () => {
    try {
      const config = await getNotificationConfig()
      set({ notificationConfig: config })
    }
    catch (error) {
      console.error('[SettingsStore] Load notification config failed:', error)
    }
  },

  updateNotificationConfig: async (config) => {
    await saveNotificationConfig(config)
    set({ notificationConfig: config })
  },

  // ============ Initialization ============

  initialize: async () => {
    set({ isLoading: true })
    try {
      await Promise.all([get().loadToolConfigs(), get().loadNotificationConfig()])
    }
    catch (error) {
      console.error('[SettingsStore] Initialize failed:', error)
    }
    finally {
      set({ isLoading: false })
    }
  },
}))

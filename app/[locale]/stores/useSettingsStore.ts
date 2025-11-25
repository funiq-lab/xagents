import { create } from 'zustand'
import { type BuiltinCliTool, getAvailableCliTools, type Platform } from '@/types/tools'
import {
  getNotificationConfig,
  getSelectedCliTool,
  getToolPlatform,
  type NotificationConfig,
  saveNotificationConfig,
  setSelectedCliToolId,
} from '../db'

export interface SettingsStore {
  // Platform
  platform: Platform

  // Built-in CLI tools
  availableCliTools: BuiltinCliTool[]
  selectedCliTool: BuiltinCliTool | undefined

  // Notification configuration
  notificationConfig: NotificationConfig | null

  // Loading state
  isLoading: boolean

  // CLI tool selection methods
  loadCliTools: () => Promise<void>
  selectCliTool: (toolId: string) => Promise<void>

  // Notification configuration methods
  loadNotificationConfig: () => Promise<void>
  updateNotificationConfig: (config: NotificationConfig) => Promise<void>

  // Initialize store
  initialize: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  platform: getToolPlatform(),
  availableCliTools: [],
  selectedCliTool: undefined,
  notificationConfig: null,
  isLoading: false,

  // ============ CLI Tools ============

  loadCliTools: async () => {
    try {
      const platform = get().platform
      const available = getAvailableCliTools(platform)
      const selected = await getSelectedCliTool(platform)
      set({ availableCliTools: available, selectedCliTool: selected })
    }
    catch (error) {
      console.error('[SettingsStore] Load CLI tools failed:', error)
    }
  },

  selectCliTool: async (toolId) => {
    const platform = get().platform
    await setSelectedCliToolId(toolId, platform)
    const selected = await getSelectedCliTool(platform)
    set({ selectedCliTool: selected })
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
      await Promise.all([
        get().loadCliTools(),
        get().loadNotificationConfig(),
      ])
    }
    catch (error) {
      console.error('[SettingsStore] Initialize failed:', error)
    }
    finally {
      set({ isLoading: false })
    }
  },
}))

import { create } from 'zustand'
import { unregisterSession } from '@/utils/tauri'
import { createSession, type CreateSessionInput, getActiveSessions, type ProcessSession, updateSessionStatus } from '../db'

export interface ResourceData {
  cpuUsage: number
  memoryUsage: number
}

export interface SessionStore {
  // Active process sessions
  activeSessions: ProcessSession[]

  // Real-time resource data from process monitor
  resourceData: Map<number, ResourceData>

  // Loading indicator
  isLoading: boolean

  // Store actions
  loadActiveSessions: () => Promise<void>
  addSession: (data: CreateSessionInput) => Promise<number>
  closeSession: (sessionRecordId: number, closeReason?: 'manual' | 'auto-timeout') => Promise<void>
  completeSession: (sessionRecordId: number) => Promise<void>

  // Find session by PID
  findSessionByPid: (pid: number) => ProcessSession | undefined

  // Return active sessions for a project
  getProjectActiveSessions: (projectId: number) => ProcessSession[]

  // Update resource data (in-memory only, not persisted)
  updateResource: (pid: number, data: ResourceData) => void

  // Initialize store
  initialize: () => Promise<void>
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  activeSessions: [],
  resourceData: new Map<number, ResourceData>(),
  isLoading: false,

  // ============ Load data ============

  loadActiveSessions: async () => {
    set({ isLoading: true })
    try {
      const sessions = await getActiveSessions()
      set({ activeSessions: sessions })
    }
    catch (error) {
      console.error('[SessionStore] Load active sessions failed:', error)
    }
    finally {
      set({ isLoading: false })
    }
  },

  // ============ Session operations ============

  addSession: async (data) => {
    const id = await createSession(data)
    await get().loadActiveSessions()
    return id
  },

  closeSession: async (sessionRecordId, closeReason = 'manual') => {
    // Find the session before closing
    const session = get().activeSessions.find(s => s.id === sessionRecordId)

    try {
      // Update database status
      await updateSessionStatus(sessionRecordId, 'closed', closeReason)

      // Don't close process for now, only unregister
      // If manual close and process is still running, kill it
      // if (closeReason === 'manual' && session?.pid && session.toolType === 'cli') {
      //   try {
      //     await killProcess(session.pid)
      //     console.info('[SessionStore] Killed process:', session.pid)
      //   }
      //   catch (error) {
      //     console.error('[SessionStore] Failed to kill process:', error)
      //     // Continue even if kill fails (process might already be dead)
      //   }
      // }

      // Unregister from monitor
      if (session?.pid) {
        try {
          await unregisterSession(session.pid)
          console.info('[SessionStore] Unregistered session from monitor:', session.pid)
        }
        catch (error) {
          console.error('[SessionStore] Failed to unregister session:', error)
        }
      }

      // Reload active sessions
      await get().loadActiveSessions()
    }
    catch (error) {
      console.error('[SessionStore] Close session failed:', error)
      throw error
    }
  },

  completeSession: async (sessionRecordId) => {
    await updateSessionStatus(sessionRecordId, 'completed')
    await get().loadActiveSessions()
  },

  // ============ Query helpers ============

  findSessionByPid: pid => get().activeSessions.find(s => s.pid === pid),

  getProjectActiveSessions: (projectId) => {
    return get().activeSessions.filter(s => s.projectId === projectId)
  },

  // ============ Resource updates ============

  updateResource: (pid, data) => {
    set((state) => {
      const newResourceData = new Map(state.resourceData)
      newResourceData.set(pid, data)
      return { resourceData: newResourceData }
    })
  },

  // ============ Initialization ============

  initialize: async () => {
    await get().loadActiveSessions()
  },
}))

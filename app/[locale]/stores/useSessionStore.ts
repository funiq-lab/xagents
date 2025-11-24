import { create } from 'zustand'
import { createSession, type CreateSessionInput, getActiveSessions, type ProcessSession, updateSessionResources, updateSessionStatus } from '../db'

export interface ResourceData {
  pid: number
  cpuUsage: number
  memoryUsage: number
  lastUpdate: number
}

export interface SessionStore {
  // Active process sessions
  activeSessions: ProcessSession[]

  // Live resource data (sessionId -> ResourceData)
  resourceData: Map<string, ResourceData>

  // Loading indicator
  isLoading: boolean

  // Store actions
  loadActiveSessions: () => Promise<void>
  addSession: (data: CreateSessionInput) => Promise<number>
  closeSession: (sessionId: number, closeReason?: 'manual' | 'completed' | 'crashed' | 'killed') => Promise<void>

  // Update resource metrics
  updateResource: (sessionId: string, data: Omit<ResourceData, 'lastUpdate'>) => void

  // Update persisted session info
  updateSessionInfo: (
    sessionId: number,
    data: {
      cpuUsage?: number
      memoryUsage?: number
      progress?: number
      lastOutput?: string
      tokenUsage?: { used: number, total?: number }
    }
  ) => Promise<void>

  // Find session by PID
  findSessionByPid: (pid: number) => ProcessSession | undefined

  // Find session by string sessionId
  findSessionById: (sessionId: string) => ProcessSession | undefined

  // Return active sessions for a project
  getProjectActiveSessions: (projectId: number) => ProcessSession[]

  // Initialize store
  initialize: () => Promise<void>
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  activeSessions: [],
  resourceData: new Map(),
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

  closeSession: async (sessionId, closeReason) => {
    // Lookup session to access UUID sessionId
    const session = get().activeSessions.find(s => s.id === sessionId)

    await updateSessionStatus(sessionId, 'closed', closeReason)
    await get().loadActiveSessions()

    // Remove entry from resource map (uses UUID sessionId just like updateResource)
    if (session?.sessionId) {
      set((state) => {
        const newResourceData = new Map(state.resourceData)
        newResourceData.delete(session.sessionId!)
        return { resourceData: newResourceData }
      })
    }
  },

  // ============ Resource updates ============

  updateResource: (sessionId, data) => {
    set((state) => {
      const newResourceData = new Map(state.resourceData)
      newResourceData.set(sessionId, {
        ...data,
        lastUpdate: Date.now(),
      })
      return { resourceData: newResourceData }
    })
  },

  updateSessionInfo: async (sessionId, data) => {
    await updateSessionResources(sessionId, data)

    // Update local state
    set(state => ({
      activeSessions: state.activeSessions.map(session =>
        session.id === sessionId ? { ...session, ...data } : session,
      ),
    }))
  },

  // ============ Query helpers ============

  findSessionByPid: (pid) => {
    return get().activeSessions.find(s => s.pid === pid)
  },

  findSessionById: (sessionId) => {
    // Try matching by UUID sessionId first
    const bySessionId = get().activeSessions.find(s => s.sessionId === sessionId)
    if (bySessionId)
      return bySessionId

    // Fallback to legacy numeric ID if needed
    return get().activeSessions.find(s => s.id?.toString() === sessionId)
  },

  getProjectActiveSessions: (projectId) => {
    return get().activeSessions.filter(s => s.projectId === projectId)
  },

  // ============ Initialization ============

  initialize: async () => {
    await get().loadActiveSessions()
  },
}))

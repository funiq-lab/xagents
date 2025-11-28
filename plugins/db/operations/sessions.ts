import type { ProcessSession } from '../schema'
import { getNextId, loadState, mutateState } from '../store'

export interface CreateSessionInput {
  projectId: number
  toolName: string
  toolType: 'ide' | 'cli'
  startTime: number
  pid: number
  hasWindowPid?: boolean // True if pid is window PID, false if fallback to parent process
}

export async function createSession(data: CreateSessionInput): Promise<number> {
  let newId = 0
  await mutateState((state) => {
    newId = getNextId(state, 'sessions')
    state.sessions.push({
      ...data,
      id: newId,
      status: 'running',
    })
  })
  return newId
}

export async function updateSessionStatus(
  sessionRecordId: number,
  status: 'completed' | 'closed',
  closeReason?: 'manual' | 'auto-timeout',
): Promise<void> {
  await mutateState((state) => {
    const session = state.sessions.find(s => s.id === sessionRecordId)
    if (session) {
      session.status = status
      session.endTime = Date.now()
      session.closeReason = closeReason
    }
  })
}

export async function getSessionById(id: number): Promise<ProcessSession | undefined> {
  const state = await loadState()
  return state.sessions.find(session => session.id === id)
}

export async function getProjectSessions(
  projectId: number,
  includeHistory = false,
): Promise<ProcessSession[]> {
  const state = await loadState()
  let sessions = state.sessions.filter(session => session.projectId === projectId)

  if (!includeHistory)
    sessions = sessions.filter(session => session.status === 'running')
  else
    sessions.sort((a, b) => b.startTime - a.startTime)

  return sessions
}

export async function getActiveSessionByProjectAndTool(
  projectId: number,
  toolName: string,
): Promise<ProcessSession | undefined> {
  const state = await loadState()
  return state.sessions.find(
    session =>
      session.projectId === projectId
      && session.toolName === toolName
      && session.status === 'running',
  )
}

export async function getActiveSessions(): Promise<ProcessSession[]> {
  const state = await loadState()
  return state.sessions.filter(session => session.status === 'running')
}

export async function getAllSessions(): Promise<ProcessSession[]> {
  const state = await loadState()
  return [...state.sessions].sort((a, b) => b.startTime - a.startTime)
}

export async function deleteSession(id: number): Promise<void> {
  await mutateState((state) => {
    state.sessions = state.sessions.filter(session => session.id !== id)
  })
}

export async function cleanupOldSessions(daysAgo = 30): Promise<void> {
  const cutoffTime = Date.now() - daysAgo * 24 * 60 * 60 * 1000
  await mutateState((state) => {
    state.sessions = state.sessions.filter((session) => {
      if (session.status === 'running')
        return true
      if (!session.endTime)
        return true
      return session.endTime >= cutoffTime
    })
  })
}

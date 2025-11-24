import { db, type ProcessSession } from '../schema'

export interface CreateSessionInput {
  projectId: number
  toolName: string
  toolType: 'ide' | 'cli'
  pid: number
  processStartTime: number
  sessionId?: string // UUID from Rust backend (for CLI tools)
}

export async function createSession(data: CreateSessionInput): Promise<number> {
  const id = await db.sessions.add({
    ...data,
    status: 'running',
    startTime: Date.now(),
  })

  if (id === undefined) {
    throw new Error('Failed to create session: ID is undefined')
  }

  return id
}

export async function updateSessionStatus(
  sessionId: number,
  status: 'completed' | 'failed' | 'closed',
  closeReason?: 'manual' | 'completed' | 'crashed' | 'killed',
): Promise<void> {
  await db.sessions.update(sessionId, {
    status,
    endTime: Date.now(),
    closeReason,
  })
}

export async function updateSessionResources(
  sessionId: number,
  data: {
    cpuUsage?: number
    memoryUsage?: number
    progress?: number
    lastOutput?: string
    tokenUsage?: { used: number, total?: number }
  },
): Promise<void> {
  await db.sessions.update(sessionId, data)
}

export async function getSessionById(id: number): Promise<ProcessSession | undefined> {
  return await db.sessions.get(id)
}

export async function getSessionByPid(pid: number): Promise<ProcessSession | undefined> {
  return await db.sessions.where('pid').equals(pid).first()
}

export async function getProjectSessions(
  projectId: number,
  includeHistory = false,
): Promise<ProcessSession[]> {
  let sessions = await db.sessions.where('projectId').equals(projectId).toArray()

  if (!includeHistory) {
    sessions = sessions.filter(s => s.status === 'running')
  }
  else {
    sessions.sort((a, b) => b.startTime - a.startTime)
  }

  return sessions
}

export async function getActiveSessions(): Promise<ProcessSession[]> {
  return await db.sessions.where('status').equals('running').toArray()
}

export async function getAllSessions(): Promise<ProcessSession[]> {
  return await db.sessions.orderBy('startTime').reverse().toArray()
}

export async function deleteSession(id: number): Promise<void> {
  await db.sessions.delete(id)
}

export async function cleanupOldSessions(daysAgo = 30): Promise<void> {
  const cutoffTime = Date.now() - daysAgo * 24 * 60 * 60 * 1000

  await db.sessions
    .where('endTime')
    .below(cutoffTime)
    .and(session => session.status !== 'running')
    .delete()
}

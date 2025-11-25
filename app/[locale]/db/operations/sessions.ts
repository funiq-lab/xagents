import { db, type ProcessSession } from '../schema'

export interface CreateSessionInput {
  projectId: number
  toolName: string
  toolType: 'ide' | 'cli'
  startTime: number
  pid: number
}

export async function createSession(data: CreateSessionInput): Promise<number> {
  const id = await db.sessions.add({
    ...data,
    status: 'running',
  })

  if (id === undefined) {
    throw new Error('Failed to create session: ID is undefined')
  }

  return id
}

export async function updateSessionStatus(
  sessionRecordId: number,
  status: 'completed' | 'closed',
  closeReason?: 'manual' | 'auto-timeout',
): Promise<void> {
  await db.sessions.update(sessionRecordId, {
    status,
    endTime: Date.now(),
    closeReason,
  })
}

export async function getSessionById(id: number): Promise<ProcessSession | undefined> {
  return await db.sessions.get(id)
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

/**
 * Get active session for a project by tool name
 * Returns the session if it exists and is running
 */
export async function getActiveSessionByProjectAndTool(
  projectId: number,
  toolName: string,
): Promise<ProcessSession | undefined> {
  const sessions = await db.sessions
    .where('projectId')
    .equals(projectId)
    .and(session => session.toolName === toolName && session.status === 'running')
    .toArray()

  return sessions.length > 0 ? sessions[0] : undefined
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

/**
 * Close all zombie sessions (sessions marked as running but no longer active)
 * This should be called on app startup to clean up sessions from previous runs
 */
export async function closeZombieSessions(): Promise<number> {
  const runningSessions = await getActiveSessions()

  if (runningSessions.length === 0) {
    return 0
  }

  // Mark all running sessions as closed with auto-timeout reason
  // because they were left running from previous app session
  const updatePromises = runningSessions.map(session =>
    updateSessionStatus(session.id!, 'closed', 'auto-timeout'),
  )

  await Promise.all(updatePromises)

  console.info(`[DB] Closed ${runningSessions.length} zombie sessions`)
  return runningSessions.length
}

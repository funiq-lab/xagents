import { closeZombieSessions } from './operations/sessions'
// Database initialization
import { db } from './schema'

export * from './operations/groups'

// Export operation helpers
export * from './operations/projects'

export * from './operations/sessions'
export * from './operations/settings'
export * from './operations/tags'
// Export database instance
export { db } from './schema'
// Export shared types
export type {
  Group,
  NotificationConfig,
  ProcessSession,
  Project,
  Settings,
  Tag,
} from './schema'
export type { Platform, ToolLaunchConfig, ToolType } from '@/types/tools'

let isInitialized = false

/**
 * Initialize database with default data
 */
export async function initializeDatabase(): Promise<void> {
  if (isInitialized)
    return

  try {
    // Clean up zombie sessions from previous app runs
    const closedCount = await closeZombieSessions()
    if (closedCount > 0) {
      console.info(`[XAgents] Cleaned up ${closedCount} zombie sessions from previous run`)
    }

    isInitialized = true
    console.info('[XAgents] Database initialized successfully')
  }
  catch (error) {
    console.error('[XAgents] Database initialization failed:', error)
  }
}

/**
 * Reset database (dev/testing only)
 */
export async function resetDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.error('[XAgents] Database reset is disabled in production')
    return
  }

  try {
    await db.delete()
    console.info('[XAgents] Database reset successfully')

    // Re-create database instance
    const newDb = new (db.constructor as new () => typeof db)()
    Object.assign(db, newDb)

    isInitialized = false
    await initializeDatabase()
  }
  catch (error) {
    console.error('[XAgents] Database reset failed:', error)
  }
}

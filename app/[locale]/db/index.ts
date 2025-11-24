import { createGroup } from './operations/groups'
import { createTag } from './operations/tags'
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
export type { ToolLaunchConfig, ToolPlatform, ToolType } from '@/types/tools'

let isInitialized = false

/**
 * Initialize database with default data
 */
export async function initializeDatabase(): Promise<void> {
  if (isInitialized)
    return

  try {
    // Check if seed data already exists
    const groupCount = await db.groups.count()
    const tagCount = await db.tags.count()

    if (groupCount === 0) {
      // Add default groups
      await createGroup('个人项目', '#3b82f6')
      await createGroup('工作项目', '#10b981')
      await createGroup('开源项目', '#8b5cf6')
    }

    if (tagCount === 0) {
      // Add default tags
      await createTag('React', '#61dafb')
      await createTag('Python', '#3776ab')
      await createTag('Rust', '#ce422b')
      await createTag('TypeScript', '#3178c6')
      await createTag('紧急', '#ef4444')
      await createTag('学习中', '#f59e0b')
    }

    isInitialized = true
    console.log('[XAgents] Database initialized successfully')
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
    console.warn('[XAgents] Database reset is disabled in production')
    return
  }

  try {
    await db.delete()
    console.log('[XAgents] Database reset successfully')

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

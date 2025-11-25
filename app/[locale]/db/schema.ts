import Dexie, { type EntityTable } from 'dexie'

// ============ types ============

export interface Project {
  id?: number
  name: string
  description?: string
  path: string
  groupId?: number
  tagIds: number[]
  createdAt: number
  updatedAt: number
}

export interface Group {
  id?: number
  name: string
  color: string
  createdAt: number
}

export interface Tag {
  id?: number
  name: string
  color: string
  createdAt: number
}

export interface ProcessSession {
  id?: number
  projectId: number
  toolName: string
  toolType: 'ide' | 'cli'
  pid: number // Process PID - required
  status: 'running' | 'completed' | 'closed'
  startTime: number // Used for PID reuse detection
  endTime?: number
  closeReason?: 'manual' | 'auto-timeout'
}

export interface Settings {
  key: string
  value: unknown
  updatedAt: number
}

export interface NotificationConfig {
  enabled: boolean
  taskComplete: boolean
  taskFailed: boolean
  resourceAlert: boolean
  quietHours?: {
    enabled: boolean
    start: string
    end: string
  }
}

// ============ database definition ============

export class XAgentsDB extends Dexie {
  projects!: EntityTable<Project, 'id'>
  groups!: EntityTable<Group, 'id'>
  tags!: EntityTable<Tag, 'id'>
  sessions!: EntityTable<ProcessSession, 'id'>
  settings!: EntityTable<Settings, 'key'>

  constructor() {
    super('xagents_db')

    // Version 1: Initial schema
    this.version(1).stores({
      projects: '++id, &path, name, groupId, createdAt, updatedAt',
      groups: '++id, &name, createdAt',
      tags: '++id, &name, createdAt',
      sessions: '++id, projectId, toolName, pid, status, startTime, endTime, [projectId+toolName+status]',
      settings: '&key, updatedAt',
    })
  }
}

export const db = new XAgentsDB()

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
  sessionId?: string // UUID from Rust backend
  projectId: number
  toolName: string
  toolType: 'ide' | 'cli'
  pid: number
  status: 'running' | 'completed' | 'failed' | 'closed'
  startTime: number
  endTime?: number
  processStartTime: number
  closeReason?: 'manual' | 'completed' | 'crashed' | 'killed'

  cpuUsage?: number
  memoryUsage?: number

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

    this.version(1).stores({
      projects: '++id, &path, name, groupId, createdAt, updatedAt',
      groups: '++id, &name, createdAt',
      tags: '++id, &name, createdAt',
      sessions: '++id, &sessionId, projectId, toolName, pid, status, startTime, endTime',
      settings: '&key, updatedAt',
    })
  }
}

export const db = new XAgentsDB()

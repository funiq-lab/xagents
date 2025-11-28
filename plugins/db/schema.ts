'use client'

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
  pid: number
  hasWindowPid?: boolean // True if pid is window PID, false if fallback to parent process
  status: 'running' | 'completed' | 'closed'
  startTime: number
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

export type ToolConfigType = 'claude' | 'codex' | 'gemini'

export interface ClaudeConfig {
  id?: number
  name: string
  isActive: boolean
  settingsConfig: {
    env: Record<string, string>
  }
  createdAt: number
  updatedAt: number
}

export interface CodexConfig {
  id?: number
  name: string
  isActive: boolean
  auth: Record<string, any>
  config: string
  createdAt: number
  updatedAt: number
}

export interface GeminiConfig {
  id?: number
  name: string
  isActive: boolean
  settingsConfig: {
    env: Record<string, string>
  }
  createdAt: number
  updatedAt: number
}

export interface DatabaseCounters {
  projects: number
  groups: number
  tags: number
  sessions: number
  claudeConfigs: number
  codexConfigs: number
  geminiConfigs: number
}

export interface DatabaseState {
  projects: Project[]
  groups: Group[]
  tags: Tag[]
  sessions: ProcessSession[]
  settings: Settings[]
  claudeConfigs: ClaudeConfig[]
  codexConfigs: CodexConfig[]
  geminiConfigs: GeminiConfig[]
  counters: DatabaseCounters
}

export function createInitialState(): DatabaseState {
  return {
    projects: [],
    groups: [],
    tags: [],
    sessions: [],
    settings: [],
    claudeConfigs: [],
    codexConfigs: [],
    geminiConfigs: [],
    counters: {
      projects: 0,
      groups: 0,
      tags: 0,
      sessions: 0,
      claudeConfigs: 0,
      codexConfigs: 0,
      geminiConfigs: 0,
    },
  }
}

import type { ToolLaunchConfig } from '@/types/tools'

export interface LaunchResult {
  pid: number
  sessionId: string
  processStartTime: number
}

export interface ProcessStatus {
  isAlive: boolean
  cpuUsage: number
  memoryUsage: number
  name: string
}

export interface ResourceUpdateEvent {
  sessionId: string
  pid: number
  cpuUsage: number
  memoryUsage: number
}

export interface ProcessStatusChangedEvent {
  sessionId: string
  newStatus: 'running' | 'completed' | 'failed' | 'closed'
  closeReason?: 'manual' | 'completed' | 'crashed' | 'killed'
}

export type { ToolLaunchConfig }

import type { ToolLaunchConfig } from '@/types/tools'

export interface LaunchResult {
  startTime: number
  pid: number
  isExistingWindow: boolean // True if focused existing window, false if new launch
}

export interface ProcessStatus {
  isAlive: boolean
  cpuUsage: number
  memoryUsage: number
  name: string
}

export interface ResourceUpdateEvent {
  pid: number
  cpuUsage: number
  memoryUsage: number
}

export interface ProcessStatusChangedEvent {
  pid: number
  newStatus: 'running' | 'completed' | 'failed' | 'closed'
  closeReason?: 'manual' | 'completed' | 'crashed' | 'killed' | 'process-exited'
}

export type { ToolLaunchConfig }

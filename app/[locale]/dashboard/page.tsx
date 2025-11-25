'use client'

import type { ResourceData } from '../stores/useSessionStore'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { isNil } from 'lodash-es'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { initializeDatabase, type ProcessSession } from '@/plugins/db'
import { useProjectStore, useSessionStore, useSettingsStore } from '../stores'
import { ChartCard, type ChartPoint } from './components/ChartCard'
import { ProjectsTable, type ProjectsTableRow } from './components/ProjectsTable'

function formatMemory(value: number) {
  if (!Number.isFinite(value) || isNil(value) || value < 0)
    return '--'
  if (value >= 1024)
    return `${(value / 1024).toFixed(2)} GB`
  return `${value.toFixed(0)} MB`
}

function getSessionMetrics(session: ProcessSession, resourceData: Map<number, ResourceData>) {
  const live = session.pid ? resourceData.get(session.pid) : undefined
  return {
    cpu: live?.cpuUsage ?? 0,
    memory: live?.memoryUsage ?? 0,
  }
}

export default function DashboardPage() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isChartsExpanded, setIsChartsExpanded] = useState(false)
  const {
    projects,
    initialize: initializeProjects,
  } = useProjectStore()
  const {
    activeSessions,
    resourceData,
    closeSession,
    initialize: initializeSessions,
  } = useSessionStore()
  const { initialize: initializeSettings } = useSettingsStore()
  const { t } = useTranslation(['global', 'dashboard'])

  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase()
        await Promise.all([initializeProjects(), initializeSessions(), initializeSettings()])
        setIsInitialized(true)
      }
      catch (error) {
        console.error('[Dashboard] Initialization failed:', error)
        toast.error(t('global.init_failed_title'), {
          description: t('global.tip.init_failed_description'),
        })
      }
    }
    init()
  }, [initializeProjects, initializeSessions, initializeSettings, t])

  const stats = useMemo(() => {
    const cpuValues: number[] = []
    const memoryValues: number[] = []

    activeSessions.forEach((session) => {
      const metrics = getSessionMetrics(session, resourceData)
      if (metrics.cpu)
        cpuValues.push(metrics.cpu)
      if (metrics.memory)
        memoryValues.push(metrics.memory)
    })

    const totalCpu = cpuValues.reduce((sum, value) => sum + value, 0)
    const totalMemory = memoryValues.reduce((sum, value) => sum + value, 0)

    return {
      totalProjects: projects.length,
      totalCpu,
      totalMemory,
    }
  }, [projects, activeSessions, resourceData])

  const cpuChartData = useMemo<ChartPoint[]>(() => {
    // Group sessions by project and calculate total CPU per project
    const projectMetrics = new Map<number, { name: string, cpu: number }>()

    projects.forEach((project) => {
      if (!project.id)
        return

      const projectSessions = activeSessions.filter(s => s.projectId === project.id)
      const totalCpu = projectSessions.reduce((sum, session) => {
        return sum + getSessionMetrics(session, resourceData).cpu
      }, 0)

      if (totalCpu >= 0) {
        projectMetrics.set(project.id, {
          name: project.name,
          cpu: totalCpu,
        })
      }
    })

    return Array.from(projectMetrics.values()).map(p => ({
      label: p.name,
      value: p.cpu,
    }))
  }, [projects, activeSessions, resourceData])

  const memoryChartData = useMemo<ChartPoint[]>(() => {
    // Group sessions by project and calculate total memory per project
    const projectMetrics = new Map<number, { name: string, memory: number }>()

    projects.forEach((project) => {
      if (!project.id)
        return

      const projectSessions = activeSessions.filter(s => s.projectId === project.id)
      const totalMemory = projectSessions.reduce((sum, session) => {
        return sum + getSessionMetrics(session, resourceData).memory
      }, 0)

      if (totalMemory >= 0) {
        projectMetrics.set(project.id, {
          name: project.name,
          memory: totalMemory,
        })
      }
    })

    return Array.from(projectMetrics.values()).map(p => ({
      label: p.name,
      value: p.memory,
    }))
  }, [projects, activeSessions, resourceData])

  const handleTerminateSessions = useCallback(async (sessionRecordIds: number[]) => {
    try {
      await Promise.all(sessionRecordIds.map(id => closeSession(id)))
      toast.success(t('dashboard.tip.close_success_title'), {
        description: t('dashboard.tip.close_success_description', { count: sessionRecordIds.length }),
      })
    }
    catch (error) {
      console.error('[Dashboard] Close sessions failed:', error)
      toast.error(t('dashboard.tip.close_failed_title'), {
        description:
          error instanceof Error
            ? error.message
            : t('global.tip.unknown_error'),
      })
    }
  }, [closeSession, t])

  const handleOpenFolder = useCallback(async (projectPath: string) => {
    try {
      await revealItemInDir(projectPath)
      toast.success(t('dashboard.tip.open_folder_success_title'), {
        description: t('dashboard.tip.open_folder_success_description', { path: projectPath }),
      })
    }
    catch (error) {
      console.error('[Dashboard] Open folder failed:', error)
      toast.error(t('dashboard.tip.open_folder_failed_title'), {
        description:
          error instanceof Error
            ? error.message
            : t('global.tip.unknown_error'),
      })
    }
  }, [t])

  const projectsTableRows = useMemo<ProjectsTableRow[]>(() => {
    return projects
      .map((project) => {
        if (!project.id)
          return null

        const sessions = activeSessions.filter(session => session.projectId === project.id)
        if (sessions.length === 0)
          return null

        const metrics = sessions.map(session => getSessionMetrics(session, resourceData))
        const totalCpu = metrics.reduce((sum, metric) => sum + metric.cpu, 0)
        const totalMemory = metrics.reduce((sum, metric) => sum + metric.memory, 0)
        const sessionRecordIds = sessions.map(session => session.id).filter((id): id is number => typeof id === 'number')

        return {
          id: project.id,
          name: project.name,
          servers: sessions.map(session => session.toolName).join(', '),
          cpu: `${totalCpu.toFixed(2)}%`,
          memory: formatMemory(totalMemory),
          onInspect: () => handleOpenFolder(project.path),
          onTerminate: sessionRecordIds.length
            ? () => handleTerminateSessions(sessionRecordIds)
            : undefined,
        }
      })
      .filter(row => Boolean(row)) as ProjectsTableRow[]
  }, [projects, activeSessions, resourceData, handleOpenFolder, handleTerminateSessions])

  if (!isInitialized) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#3498db] border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t('global.loading_data')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto">
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard
            title={t('dashboard.cpu_label')}
            data={cpuChartData}
            unit="%"
            totalValue={`${stats.totalCpu.toFixed(2)}%`}
            helperText={t('dashboard.cpu_helper')}
            isExpanded={isChartsExpanded}
            onToggleExpand={() => setIsChartsExpanded(!isChartsExpanded)}
          />
          <ChartCard
            title={t('dashboard.memory_label')}
            data={memoryChartData}
            unit=" MB"
            totalValue={formatMemory(stats.totalMemory)}
            helperText={t('dashboard.memory_helper')}
            isExpanded={isChartsExpanded}
            onToggleExpand={() => setIsChartsExpanded(!isChartsExpanded)}
          />
        </div>

        <ProjectsTable projects={projectsTableRows} className="min-h-[400px]" />
      </div>
    </div>
  )
}

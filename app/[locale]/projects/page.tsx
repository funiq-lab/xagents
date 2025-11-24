'use client'

import { Cpu, HardDrive, MonitorPlay, MoreVertical, Plus, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { launchTool } from '@/utils/tauri'
import { initializeDatabase, type Project, type ToolLaunchConfig } from '../db'
import { useProjectStore, useSessionStore, useSettingsStore } from '../stores'
import { DeleteProjectDialog } from './components/DeleteProjectDialog'
import { ProjectDialog } from './components/ProjectDialog'

type SortOption = 'newest' | 'oldest' | 'name'

function formatMemory(value?: number) {
  if (!Number.isFinite(value) || !value || value <= 0)
    return '0 MB'
  if (value >= 1024)
    return `${(value / 1024).toFixed(1)} GB`
  return `${value.toFixed(0)} MB`
}

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [tagFilter, setTagFilter] = useState<'all' | number>('all')
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const { t } = useTranslation(['global', 'projects'])

  const {
    projects,
    tags,
    groups,
    addProject,
    modifyProject,
    removeProject,
    initialize: initializeProjects,
  } = useProjectStore()
  const {
    activeSessions,
    closeSession,
    addSession,
    initialize: initializeSessions,
  } = useSessionStore()
  const { toolConfigs, initialize: initializeSettings } = useSettingsStore()

  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase()
        await Promise.all([initializeProjects(), initializeSessions(), initializeSettings()])
        setIsInitialized(true)
      }
      catch (error) {
        console.error('[Projects] Initialization failed:', error)
        toast.error(t('global.init_failed_title'), {
          description: t('global.tip.init_failed_description'),
        })
      }
    }
    init()
  }, [initializeProjects, initializeSessions, initializeSettings, t])

  const tagMap = useMemo(() => new Map(tags.map(tag => [tag.id, tag])), [tags])

  const toolGroups = useMemo(() => {
    return {
      ide: toolConfigs.filter(tool => tool.type === 'ide'),
      cli: toolConfigs.filter(tool => tool.type === 'cli'),
    }
  }, [toolConfigs])

  const toolLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    toolConfigs.forEach(tool => map.set(tool.id, tool.label))
    return map
  }, [toolConfigs])

  const sessionsByProject = useMemo(() => {
    const map = new Map<number, typeof activeSessions>()
    activeSessions.forEach((session) => {
      if (typeof session.projectId !== 'number')
        return
      const list = map.get(session.projectId) ?? []
      map.set(session.projectId, [...list, session])
    })
    return map
  }, [activeSessions])

  const normalizedProjects = useMemo(() => {
    return projects.map((project) => {
      const projectTags = project.tagIds
        .map(tagId => tagMap.get(tagId))
        .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
      return { project, projectTags }
    })
  }, [projects, tagMap])

  const filteredProjects = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return normalizedProjects
      .filter(({ project }) => {
        if (!query)
          return true
        return (
          project.name.toLowerCase().includes(query)
          || (project.description || '').toLowerCase().includes(query)
        )
      })
      .filter(({ project }) => {
        if (tagFilter === 'all')
          return true
        return project.tagIds.includes(tagFilter)
      })
      .sort((a, b) => {
        if (sortOption === 'name')
          return a.project.name.localeCompare(b.project.name)
        if (sortOption === 'oldest')
          return (a.project.createdAt ?? 0) - (b.project.createdAt ?? 0)
        return (b.project.createdAt ?? 0) - (a.project.createdAt ?? 0)
      })
  }, [normalizedProjects, searchQuery, sortOption, tagFilter])

  const handleCreateProject = () => {
    setEditingProject(undefined)
    setProjectDialogOpen(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setProjectDialogOpen(true)
  }

  const handleSaveProject = async (data: {
    name: string
    description?: string
    path: string
    groupId?: number
    tagIds: number[]
  }) => {
    try {
      if (editingProject) {
        await modifyProject(editingProject.id!, data)
        toast.success(t('projects.tip.update_success'))
      }
      else {
        await addProject(data)
        toast.success(t('projects.tip.create_success'))
      }
      setProjectDialogOpen(false)
      setEditingProject(undefined)
    }
    catch (error) {
      console.error('[Projects] Save project failed:', error)
      toast.error(t('global.save_failed_title'), {
        description:
          error instanceof Error
            ? error.message
            : t('global.tip.unknown_error'),
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingProject)
      return

    try {
      await removeProject(deletingProject.id!)
      toast.success(t('projects.tip.delete_success'))
      setDeletingProject(null)
      setDeleteDialogOpen(false)
    }
    catch (error) {
      console.error('[Projects] Delete project failed:', error)
      toast.error(t('global.delete_failed_title'), {
        description:
          error instanceof Error
            ? error.message
            : t('global.tip.unknown_error'),
      })
    }
  }

  const handleLaunchTool = async (project: Project, tool: ToolLaunchConfig) => {
    try {
      if (!project.id)
        throw new Error(t('projects.tip.missing_id'))

      const result = await launchTool(tool, project.path)

      await addSession({
        projectId: project.id,
        toolName: tool.id,
        toolType: tool.type,
        pid: result.pid,
        processStartTime: result.processStartTime,
        sessionId: result.sessionId,
      })

      toast.success(t('projects.tip.launch_success'), {
        description: t('projects.tip.launch_success_tip', { tool: tool.label }),
      })
    }
    catch (error) {
      console.error('[Projects] Launch tool failed:', error)
      toast.error(t('global.action_failed_title'), {
        description:
          error instanceof Error
            ? error.message
            : t('global.tip.unknown_error'),
      })
    }
  }

  const handleCloseSession = async (sessionId: number) => {
    try {
      await closeSession(sessionId)
      toast.success(t('projects.tip.close_session_success'))
    }
    catch (error) {
      console.error('[Projects] Close session failed:', error)
      toast.error(t('global.action_failed_title'), {
        description:
          error instanceof Error
            ? error.message
            : t('global.tip.unknown_error'),
      })
    }
  }

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
    <div className="flex-1 p-6 overflow-auto space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={t('projects.tip.search_placeholder')}
            className="w-full pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={sortOption} onValueChange={value => setSortOption(value as SortOption)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('global.sort_by')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t('global.newest')}</SelectItem>
              <SelectItem value="oldest">{t('global.oldest')}</SelectItem>
              <SelectItem value="name">{t('global.name')}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={tagFilter === 'all' ? 'all' : tagFilter.toString()}
            onValueChange={value => setTagFilter(value === 'all' ? 'all' : Number(value))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('projects.all_tags')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('projects.all_tags')}</SelectItem>
              {tags.map(tag => (
                <SelectItem key={tag.id} value={tag.id!.toString()}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleCreateProject}>
            <Plus className="w-4 h-4 mr-2" />
            {t('projects.create_project')}
          </Button>
        </div>
      </div>

      {filteredProjects.length === 0 && (
        <Card className="p-10 text-center border-dashed border-2 text-muted-foreground">
          {t('projects.tip.empty_state')}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(({ project, projectTags }) => {
          if (!project.id)
            return null

          const projectSessions = sessionsByProject.get(project.id) ?? []

          return (
            <Card
              key={project.id}
              className="group relative flex flex-col p-6 hover:shadow-md transition-all duration-200 border-border"
              style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}
            >
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-semibold truncate" title={project.name}>
                    {project.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{project.path}</p>
                </div>

                <div className="shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {toolGroups.ide.map(tool => (
                        <DropdownMenuItem
                          key={tool.id}
                          onClick={() => handleLaunchTool(project, tool)}
                        >
                          {t('projects.open_tool', { tool: tool.label })}
                        </DropdownMenuItem>
                      ))}
                      {toolGroups.ide.length > 0 && toolGroups.cli.length > 0 && <DropdownMenuSeparator />}
                      {toolGroups.cli.map(tool => (
                        <DropdownMenuItem
                          key={tool.id}
                          onClick={() => handleLaunchTool(project, tool)}
                        >
                          {t('projects.launch_tool', { tool: tool.label })}
                        </DropdownMenuItem>
                      ))}
                      {toolGroups.ide.length === 0 && toolGroups.cli.length === 0 && (
                        <DropdownMenuItem disabled>
                          {t('projects.no_launch_config')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEditProject(project)}>
                        {t('projects.edit_project')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setDeletingProject(project)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        {t('projects.delete_project')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {project.description || t('global.no_description')}
              </p>

              {projectSessions.length > 0 && (
                <div className="flex flex-col gap-2 mb-4">
                  {projectSessions.map((session) => {
                    const cpu = session.cpuUsage ?? 0
                    const memory = session.memoryUsage ?? 0
                    const toolLabel = toolLabelMap.get(session.toolName) ?? session.toolName
                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between bg-secondary/30 rounded-md p-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MonitorPlay className="w-3 h-3 text-primary shrink-0" />
                          <span className="font-medium truncate capitalize">{toolLabel}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Cpu className="w-3 h-3" />
                            {cpu ? `${cpu.toFixed(1)}%` : '--'}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <HardDrive className="w-3 h-3" />
                            {memory ? formatMemory(memory) : '--'}
                          </div>
                          {session.id && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleCloseSession(session.id!)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-auto pt-2">
                {projectTags.length === 0 && (
                  <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                    {t('global.uncategorized')}
                  </Badge>
                )}
                {projectTags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-xs font-normal"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={(open) => {
          setProjectDialogOpen(open)
          if (!open)
            setEditingProject(undefined)
        }}
        project={editingProject}
        groups={groups}
        tags={tags}
        onSave={handleSaveProject}
      />

      <DeleteProjectDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        project={deletingProject}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

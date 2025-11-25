'use client'

import { isNil } from 'lodash-es'
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
import { BUILTIN_AI_CLI_TOOLS, BUILTIN_IDE_TOOLS } from '@/types/tools'
import { launchAiCLI, launchIDE, registerSession } from '@/utils/tauri'
import { getActiveSessionByProjectAndTool, initializeDatabase, type Project } from '../db'
import { useProjectStore, useSessionStore, useSettingsStore } from '../stores'
import { DeleteProjectDialog } from './components/DeleteProjectDialog'
import { ProjectDialog } from './components/ProjectDialog'

type SortOption = 'newest' | 'oldest' | 'name'

function formatMemory(value?: number) {
  if (!Number.isFinite(value) || isNil(value) || value < 0)
    return '0 MB'
  if (value >= 1024)
    return `${(value / 1024).toFixed(2)} GB`
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
    addGroup,
    addTag,
    removeGroup,
    removeTag,
    addProject,
    modifyProject,
    removeProject,
    initialize: initializeProjects,
  } = useProjectStore()
  const {
    activeSessions,
    resourceData,
    closeSession,
    addSession,
    initialize: initializeSessions,
  } = useSessionStore()
  const {
    selectedCliTool,
    initialize: initializeSettings,
  } = useSettingsStore()

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

  useEffect(() => {
    console.info(resourceData)
  }, [resourceData])

  const tagMap = useMemo(() => new Map(tags.map(tag => [tag.id, tag])), [tags])

  const toolLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    // IDE tools
    BUILTIN_IDE_TOOLS.forEach(tool => map.set(tool.id, tool.label))
    // AI CLI tools
    BUILTIN_AI_CLI_TOOLS.forEach(tool => map.set(tool.id, tool.label))
    // Selected terminal tool
    if (selectedCliTool) {
      map.set(selectedCliTool.id, selectedCliTool.label)
    }
    return map
  }, [selectedCliTool])

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

  const handleLaunchIDE = async (project: Project, ideId: 'vscode' | 'cursor') => {
    try {
      if (!project.id)
        throw new Error(t('projects.tip.missing_id'))

      const ideTool = BUILTIN_IDE_TOOLS.find(tool => tool.id === ideId)
      if (!ideTool)
        throw new Error('IDE tool not found')

      const result = await launchIDE(ideTool, project.path)
      console.info('[Projects] Launch result:', {
        isExistingWindow: result.isExistingWindow,
        pid: result.pid,
      })

      // If this is an existing window, check if it's already bound to current project
      if (result.isExistingWindow) {
        const existingSession = await getActiveSessionByProjectAndTool(project.id, ideTool.id)
        console.info('[Projects] Existing session:', existingSession)

        // If window is already bound to current project, just show focus message
        if (existingSession && result.pid === existingSession.pid) {
          console.info('[Projects] Focused existing window bound to current project, pid:', existingSession.pid)
          toast.success(t('projects.tip.window_focused'), {
            description: t('projects.tip.window_focused_tip', { tool: ideTool.label }),
          })
          return
        }

        // Window exists but not bound to current project
        // This can happen when user opens a different project in the same VSCode window
        // In this case, we need to create a new session for current project
        console.info('[Projects] Window exists but not bound to current project, creating new session')
      }

      // Either this is a new launch, or window exists but not bound to current project
      // In both cases, create new session
      await addSession({
        projectId: project.id,
        toolName: ideTool.id,
        toolType: 'ide',
        pid: result.pid,
        startTime: result.startTime,
      })

      // Register session to process monitor if PID is available
      if (result.pid) {
        console.info('[Projects] Registering new session to monitor (pid):', result.pid)
        await registerSession(result.pid, result.startTime)
      }

      toast.success(t('projects.tip.launch_success'), {
        description: t('projects.tip.launch_success_tip', { tool: ideTool.label }),
      })
    }
    catch (error) {
      console.error('[Projects] Launch IDE failed:', error)
      toast.error(t('global.action_failed_title'), {
        description:
          error instanceof Error
            ? error.message
            : t('global.tip.unknown_error'),
      })
    }
  }

  const handleLaunchAiCLI = async (project: Project, aiToolId: 'claude' | 'codex' | 'gemini') => {
    try {
      if (!project.id)
        throw new Error(t('projects.tip.missing_id'))

      if (!selectedCliTool) {
        toast.error(t('projects.tip.no_cli_tool_selected'))
        return
      }

      const aiTool = BUILTIN_AI_CLI_TOOLS.find(tool => tool.id === aiToolId)
      if (!aiTool)
        throw new Error('AI CLI tool not found')

      const result = await launchAiCLI(aiTool, selectedCliTool, project.path)

      await addSession({
        projectId: project.id,
        toolName: aiTool.id,
        toolType: 'cli',
        pid: result.pid,
        startTime: result.startTime,
      })

      // Register session to process monitor if PID is available
      if (result.pid) {
        console.info('[Projects] Registering session to monitor (pid):', result.pid)
        await registerSession(result.pid, result.startTime)
      }

      toast.success(t('projects.tip.launch_success'), {
        description: t('projects.tip.launch_success_tip', { tool: aiTool.label }),
      })
    }
    catch (error) {
      console.error('[Projects] Launch AI CLI failed:', error)
      toast.error(t('global.action_failed_title'), {
        description:
          error instanceof Error
            ? error.message
            : t('global.tip.unknown_error'),
      })
    }
  }

  const handleCloseSession = async (sessionRecordId: number) => {
    try {
      await closeSession(sessionRecordId)
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
                      {/* IDE Tools Launch */}
                      {BUILTIN_IDE_TOOLS.map(ide => (
                        <DropdownMenuItem
                          key={ide.id}
                          onClick={() => handleLaunchIDE(project, ide.id)}
                        >
                          {t('projects.open_tool', { tool: ide.label })}
                        </DropdownMenuItem>
                      ))}

                      <DropdownMenuSeparator />

                      {/* AI CLI Tools Launch */}
                      {selectedCliTool && BUILTIN_AI_CLI_TOOLS.map(aiTool => (
                        <DropdownMenuItem
                          key={aiTool.id}
                          onClick={() => handleLaunchAiCLI(project, aiTool.id)}
                        >
                          {t('projects.open_ai_cli', { tool: aiTool.label })}
                        </DropdownMenuItem>
                      ))}

                      {!selectedCliTool && (
                        <DropdownMenuItem disabled>
                          {t('projects.tip.no_cli_tool_selected')}
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
                    // Get real-time resource data from resourceData map (not from session)
                    const resource = session.pid ? resourceData.get(session.pid) : undefined
                    const cpu = resource?.cpuUsage ?? 0
                    const memory = resource?.memoryUsage ?? 0
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
                            {cpu && !isNil(cpu) ? `${cpu.toFixed(2)}%` : '--'}
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
        onCreateGroup={addGroup}
        onCreateTag={addTag}
        onDeleteGroup={removeGroup}
        onDeleteTag={removeTag}
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

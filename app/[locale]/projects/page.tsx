'use client'

import type { SortOption } from '@/types/project'
import { isNil } from 'lodash-es'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getActiveSessionByProjectAndTool, initializeDatabase, type ProcessSession, type Project } from '@/plugins/db'
import { BUILTIN_AI_CLI_TOOLS, BUILTIN_IDE_TOOLS } from '@/types/tools'
import { getRandomAccentColor } from '@/utils/colors'
import { focusWindowByPid, launchAiCLI, launchIDE, listSubdirectories, registerSession, selectDirectory } from '@/utils/tauri'
import { useProjectStore, useSessionStore, useSettingsStore } from '../stores'
import { BulkDeleteProjectsDialog } from './components/BulkDeleteProjectsDialog'
import { BulkGroupDialog } from './components/BulkGroupDialog'
import { BulkTagsDialog } from './components/BulkTagsDialog'
import { DeleteProjectDialog } from './components/DeleteProjectDialog'
import { GroupsTagsManagementDialog } from './components/GroupsTagsManagementDialog'
import { ProjectCard } from './components/ProjectCard'
import { ProjectDialog } from './components/ProjectDialog'
import { ProjectHeader } from './components/ProjectHeader'

function sanitizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+$/, '')
}

function extractFolderName(path: string): string {
  const normalized = sanitizePath(path)
  const segments = normalized.split('/').filter(Boolean)
  return segments.pop() ?? normalized
}

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
  const [groupFilter, setGroupFilter] = useState<'all' | number>('all')
  const [tagFilter, setTagFilter] = useState<'all' | number>('all')
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([])
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bulkGroupDialogOpen, setBulkGroupDialogOpen] = useState(false)
  const [bulkTagsDialogOpen, setBulkTagsDialogOpen] = useState(false)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [managementDialogOpen, setManagementDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const { t } = useTranslation(['global', 'projects'])

  const {
    projects,
    tags,
    groups,
    addGroup,
    modifyGroup,
    removeGroup,
    addTag,
    modifyTag,
    removeTag,
    addProject,
    bulkAddProjects,
    modifyProject,
    removeProject,
    bulkUpdateProjects,
    bulkRemoveProjects,
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

  useEffect(() => {
    setSelectedProjectIds(ids => ids.filter(id => projects.some(project => project.id === id)))
  }, [projects])

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
        const description = (project.description || '').toLowerCase()
        const path = project.path.toLowerCase()
        return (
          project.name.toLowerCase().includes(query)
          || description.includes(query)
          || path.includes(query)
        )
      })
      .filter(({ project }) => {
        if (tagFilter === 'all')
          return true
        return project.tagIds.includes(tagFilter)
      })
      .filter(({ project }) => {
        if (groupFilter === 'all')
          return true
        return project.groupId === groupFilter
      })
      .sort((a, b) => {
        if (sortOption === 'name')
          return a.project.name.localeCompare(b.project.name)
        if (sortOption === 'oldest')
          return (a.project.createdAt ?? 0) - (b.project.createdAt ?? 0)
        return (b.project.createdAt ?? 0) - (a.project.createdAt ?? 0)
      })
  }, [normalizedProjects, searchQuery, sortOption, tagFilter, groupFilter])

  const visibleProjectIds = useMemo(() => {
    return filteredProjects
      .map(({ project }) => project.id)
      .filter((id): id is number => typeof id === 'number')
  }, [filteredProjects])

  const allVisibleSelected = useMemo(() => {
    if (visibleProjectIds.length === 0)
      return false
    return visibleProjectIds.every(id => selectedProjectIds.includes(id))
  }, [selectedProjectIds, visibleProjectIds])

  const selectionCount = selectedProjectIds.length

  const handleCreateProject = () => {
    setEditingProject(undefined)
    setProjectDialogOpen(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setProjectDialogOpen(true)
  }

  const handleRequestDelete = (projectId: number) => {
    setDeletingProjectId(projectId)
    setDeleteDialogOpen(true)
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

  const toggleProjectSelection = (projectId: number) => {
    setSelectedProjectIds((prev) => {
      if (prev.includes(projectId))
        return prev.filter(id => id !== projectId)
      return [...prev, projectId]
    })
  }

  const handleToggleSelectAllVisible = () => {
    if (!visibleProjectIds.length)
      return
    setSelectedProjectIds((prev) => {
      if (visibleProjectIds.every(id => prev.includes(id))) {
        return prev.filter(id => !visibleProjectIds.includes(id))
      }
      const combined = new Set([...prev, ...visibleProjectIds])
      return Array.from(combined)
    })
  }

  const clearSelection = () => {
    setSelectedProjectIds([])
  }

  const handleConfirmDelete = async () => {
    if (deletingProjectId === null)
      return

    try {
      await removeProject(deletingProjectId)
      toast.success(t('projects.tip.delete_success'))
      setDeletingProjectId(null)
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

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setDeleteDialogOpen(open)
    if (!open)
      setDeletingProjectId(null)
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

  const handleFocusSession = async (
    session: ProcessSession,
    projectPath: string,
  ) => {
    const { pid, toolType, toolName } = session
    if (!pid)
      return

    try {
      await focusWindowByPid(pid, toolType, toolName, projectPath)
      toast.success(t('projects.tip.focus_window_success'))
    }
    catch (error) {
      console.error('[Projects] Focus window failed:', error)
      toast.error(t('global.action_failed_title'), {
        description:
          error instanceof Error
            ? error.message
            : t('global.tip.unknown_error'),
      })
    }
  }

  const handleBulkImport = useCallback(async () => {
    setIsImporting(true)
    try {
      const rootPath = await selectDirectory({
        title: t('projects.tip.bulk_import_dialog_title'),
      })
      if (!rootPath)
        return

      const subdirectories = await listSubdirectories(rootPath)
      if (subdirectories.length === 0) {
        toast.info(t('projects.tip.bulk_import_no_projects'))
        return
      }

      // Filter out hidden directories (starting with .)
      const visibleDirectories = subdirectories.filter((dirPath) => {
        const folderName = extractFolderName(dirPath)
        return !folderName.startsWith('.')
      })

      if (visibleDirectories.length === 0) {
        toast.info(t('projects.tip.bulk_import_no_projects'))
        return
      }

      const rootName = extractFolderName(rootPath) || t('projects.tip.bulk_import_group_fallback')
      const existingGroup = groups.find(group => group.name.toLowerCase() === rootName.toLowerCase())
      const groupId = existingGroup
        ? existingGroup.id
        : await addGroup(rootName, getRandomAccentColor())

      const existingPaths = new Set(projects.map(project => sanitizePath(project.path)))
      const preparedProjects = visibleDirectories
        .map((dirPath) => {
          const normalizedPath = sanitizePath(dirPath)
          const projectName = extractFolderName(normalizedPath)
          return {
            name: projectName,
            path: normalizedPath,
          }
        })
        .filter(({ name, path }) => name && !existingPaths.has(path))

      if (preparedProjects.length === 0) {
        toast.info(t('projects.tip.bulk_import_no_new_projects'))
        return
      }

      await bulkAddProjects(
        preparedProjects.map(project => ({
          name: project.name,
          path: project.path,
          groupId: groupId ?? undefined,
          tagIds: [],
        })),
      )

      const skipped = visibleDirectories.length - preparedProjects.length
      toast.success(t('projects.tip.bulk_import_success', {
        count: preparedProjects.length,
        group: rootName,
      }))
      if (skipped > 0) {
        toast.info(t('projects.tip.bulk_import_skipped', { count: skipped }))
      }
    }
    catch (error) {
      console.error('[Projects] Bulk import failed:', error)
      toast.error(t('projects.tip.bulk_import_failed'), {
        description:
          error instanceof Error
            ? error.message
            : t('global.tip.unknown_error'),
      })
    }
    finally {
      setIsImporting(false)
    }
  }, [addGroup, bulkAddProjects, groups, projects, t])

  const handleBulkGroupSubmit = async (groupId?: number) => {
    if (!selectedProjectIds.length)
      return
    try {
      await bulkUpdateProjects(selectedProjectIds, { groupId })
      toast.success(t('projects.tip.bulk_group_success', { count: selectionCount }))
      clearSelection()
    }
    catch (error) {
      console.error('[Projects] Bulk group update failed:', error)
      toast.error(t('projects.tip.bulk_group_failed'))
      throw error
    }
  }

  const handleBulkTagsSubmit = async (tagIds: number[]) => {
    if (!selectedProjectIds.length)
      return
    try {
      await bulkUpdateProjects(selectedProjectIds, { tagIds })
      toast.success(t('projects.tip.bulk_tags_success', { count: selectionCount }))
      clearSelection()
    }
    catch (error) {
      console.error('[Projects] Bulk tag update failed:', error)
      toast.error(t('projects.tip.bulk_tags_failed'))
      throw error
    }
  }

  const handleBulkDeleteSelected = async () => {
    if (!selectedProjectIds.length)
      return
    try {
      await bulkRemoveProjects(selectedProjectIds)
      toast.success(t('projects.tip.bulk_delete_success', { count: selectionCount }))
      clearSelection()
    }
    catch (error) {
      console.error('[Projects] Bulk delete failed:', error)
      toast.error(t('projects.tip.bulk_delete_failed'))
      throw error
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
      <ProjectHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOption={sortOption}
        onSortChange={setSortOption}
        groupFilter={groupFilter}
        onGroupFilterChange={setGroupFilter}
        tagFilter={tagFilter}
        onTagFilterChange={setTagFilter}
        groups={groups}
        tags={tags}
        onCreateProject={handleCreateProject}
        onBulkImport={handleBulkImport}
        isBulkImporting={isImporting}
        selectAllChecked={allVisibleSelected}
        selectAllDisabled={visibleProjectIds.length === 0}
        onToggleSelectAll={handleToggleSelectAllVisible}
        onManageGroupsTags={() => setManagementDialogOpen(true)}
      />

      {selectionCount > 0 && (
        <Card className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-primary/40 ring-1 ring-primary/20 bg-primary/5">
          <p className="text-sm font-medium">
            {t('projects.tip.selection_summary', { count: selectionCount })}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setBulkGroupDialogOpen(true)}>
              {t('projects.set_group')}
            </Button>
            <Button variant="outline" onClick={() => setBulkTagsDialogOpen(true)}>
              {t('projects.set_tags')}
            </Button>
            <Button variant="destructive" onClick={() => setBulkDeleteDialogOpen(true)}>
              {t('projects.delete_selected')}
            </Button>
            <Button variant="ghost" onClick={clearSelection}>
              {t('projects.clear_selection')}
            </Button>
          </div>
        </Card>
      )}

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
          const isSelected = selectedProjectIds.includes(project.id)

          return (
            <ProjectCard
              key={project.id}
              project={project}
              projectTags={projectTags}
              projectSessions={projectSessions}
              isSelected={isSelected}
              onToggleSelect={toggleProjectSelection}
              onEdit={handleEditProject}
              onDelete={handleRequestDelete}
              onLaunchIDE={handleLaunchIDE}
              onLaunchAiCli={handleLaunchAiCLI}
              onCloseSession={handleCloseSession}
              onFocusSession={(session, path) => handleFocusSession(session, path)}
              resourceData={resourceData}
              toolLabelMap={toolLabelMap}
              hasCliToolSelected={Boolean(selectedCliTool)}
              formatMemory={formatMemory}
            />
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
      />

      {deletingProjectId !== null && (
        <DeleteProjectDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteDialogOpenChange}
          projectId={deletingProjectId}
          onConfirm={handleConfirmDelete}
        />
      )}

      <BulkGroupDialog
        open={bulkGroupDialogOpen}
        onOpenChange={setBulkGroupDialogOpen}
        groups={groups}
        count={selectionCount}
        onSubmit={handleBulkGroupSubmit}
      />

      <BulkTagsDialog
        open={bulkTagsDialogOpen}
        onOpenChange={setBulkTagsDialogOpen}
        tags={tags}
        count={selectionCount}
        onSubmit={handleBulkTagsSubmit}
      />

      <BulkDeleteProjectsDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        count={selectionCount}
        onConfirm={handleBulkDeleteSelected}
      />

      <GroupsTagsManagementDialog
        open={managementDialogOpen}
        onOpenChange={setManagementDialogOpen}
        groups={groups}
        tags={tags}
        onCreateGroup={addGroup}
        onUpdateGroup={modifyGroup}
        onDeleteGroup={removeGroup}
        onCreateTag={addTag}
        onUpdateTag={modifyTag}
        onDeleteTag={removeTag}
      />
    </div>
  )
}

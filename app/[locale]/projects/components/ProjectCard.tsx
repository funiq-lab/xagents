'use client'

import type { ResourceData } from '../../stores/useSessionStore'
import type { ProcessSession, Project, Tag } from '@/plugins/db'
import {
  Cpu,
  HardDrive,
  MonitorPlay,
  MoreVertical,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TruncatedText } from '@/components/TruncatedText'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BUILTIN_AI_CLI_TOOLS, BUILTIN_IDE_TOOLS } from '@/types/tools'
import { cn } from '@/utils/ui'

interface ProjectCardProps {
  project: Project
  projectTags: Tag[]
  projectSessions: ProcessSession[]
  isSelected: boolean
  onToggleSelect: (projectId: number) => void
  onEdit: (project: Project) => void
  onDelete: (projectId: number) => void
  onLaunchIDE: (project: Project, ideId: 'vscode' | 'cursor') => void
  onLaunchAiCli: (project: Project, aiToolId: 'claude' | 'codex' | 'gemini') => void
  onCloseSession: (sessionId: number) => void
  onFocusSession: (session: ProcessSession, projectPath: string) => void
  resourceData: Map<number, ResourceData>
  toolLabelMap: Map<string, string>
  hasCliToolSelected: boolean
  formatMemory: (value?: number) => string
}

export function ProjectCard({
  project,
  projectTags,
  projectSessions,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onLaunchIDE,
  onLaunchAiCli,
  onCloseSession,
  onFocusSession,
  resourceData,
  toolLabelMap,
  hasCliToolSelected,
  formatMemory,
}: ProjectCardProps) {
  const { t } = useTranslation(['global', 'projects'])

  if (!project.id)
    return null

  return (
    <Card
      className={cn(
        'group relative flex flex-col p-6 hover:shadow-md transition-all duration-200 border-border',
        isSelected && 'border-primary ring-2 ring-primary/40',
      )}
      style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}
    >
      <div className="flex justify-between items-center mb-4 gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Checkbox
            checked={isSelected}
            onChange={() => onToggleSelect(project.id!)}
            className="mt-1"
            aria-label={t('projects.tip.select_project') ?? 'Select project'}
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-semibold truncate" title={project.name}>
              {project.name}
            </h3>
          </div>
        </div>

        <div className="shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {BUILTIN_IDE_TOOLS.map(ide => (
                <DropdownMenuItem
                  key={ide.id}
                  onClick={() => onLaunchIDE(project, ide.id)}
                >
                  {t('projects.open_tool', { tool: ide.label })}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              {hasCliToolSelected
                ? (
                    BUILTIN_AI_CLI_TOOLS.map(aiTool => (
                      <DropdownMenuItem
                        key={aiTool.id}
                        onClick={() => onLaunchAiCli(project, aiTool.id)}
                      >
                        {t('projects.open_ai_cli', { tool: aiTool.label })}
                      </DropdownMenuItem>
                    ))
                  )
                : (
                    <DropdownMenuItem disabled>
                      {t('projects.tip.no_cli_tool_selected')}
                    </DropdownMenuItem>
                  )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(project)}>
                {t('projects.edit_project')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(project.id!)}
              >
                {t('projects.delete_project')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="w-full">
        <TruncatedText text={project.path} className="w-full text-sm text-muted-foreground" lines={3}></TruncatedText>
      </div>
      <div className="w-full">
        <TruncatedText text={project.description || t('global.no_description')} className="w-full text-sm text-muted-foreground" lines={2}></TruncatedText>
      </div>

      {projectSessions.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {projectSessions.map((session) => {
            const resource = session.pid ? resourceData.get(session.pid) : undefined
            const cpu = resource?.cpuUsage ?? 0
            const memory = resource?.memoryUsage ?? 0
            const toolLabel = toolLabelMap.get(session.toolName) ?? session.toolName

            return (
              <div
                key={session.id}
                className="flex items-center justify-between bg-secondary/30 rounded-md p-2 text-xs hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => {
                  if (session.pid && session.toolType)
                    onFocusSession(session, project.path)
                }}
                title={
                  session.pid
                    ? t('projects.tip.click_to_focus') ?? 'Click to focus window'
                    : undefined
                }
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MonitorPlay className="w-3 h-3 text-primary shrink-0" />
                  <span className="font-medium truncate capitalize">{toolLabel}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Cpu className="w-3 h-3" />
                    {cpu ? `${cpu.toFixed(2)}%` : '--'}
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
                      onClick={(event) => {
                        event.stopPropagation()
                        onCloseSession(session.id!)
                      }}
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
}

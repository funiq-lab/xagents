'use client'

import { Eye, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/utils/ui'

export interface ProjectsTableRow {
  id: number
  name: string
  servers: string
  cpu: string
  memory: string
  onInspect?: () => void
  onTerminate?: () => void
}

interface ProjectsTableProps {
  projects: ProjectsTableRow[]
  className?: string
}

export function ProjectsTable({ projects, className }: ProjectsTableProps) {
  const { t } = useTranslation(['dashboard'])

  return (
    <Card className={cn('rounded-(--radius-card) border border-border overflow-hidden', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('dashboard.column_name')}</TableHead>
            <TableHead>{t('dashboard.column_servers')}</TableHead>
            <TableHead>{t('dashboard.column_cpu')}</TableHead>
            <TableHead>{t('dashboard.column_memory')}</TableHead>
            <TableHead>{t('dashboard.column_actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0
            ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t('dashboard.tip.empty_sessions')}
                  </TableCell>
                </TableRow>
              )
            : projects.map(project => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell className="text-sm truncate">
                    {project.servers || t('dashboard.servers_fallback')}
                  </TableCell>
                  <TableCell>{project.cpu}</TableCell>
                  <TableCell>{project.memory}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        aria-label={t('dashboard.inspect_aria')}
                        onClick={project.onInspect}
                        disabled={!project.onInspect}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        aria-label={t('dashboard.terminate_aria')}
                        onClick={project.onTerminate}
                        disabled={!project.onTerminate}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </Card>
  )
}

'use client'

import { Eye, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const { t } = useTranslation(['dashboard'])

  return (
    <Card className="rounded-(--radius-card) border border-border overflow-hidden" style={{ backgroundColor: 'var(--card)' }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3" style={{ color: 'var(--card-foreground)' }}>
                {t('dashboard.column_name')}
              </th>
              <th className="text-left px-4 py-3" style={{ color: 'var(--card-foreground)' }}>
                {t('dashboard.column_servers')}
              </th>
              <th className="text-left px-4 py-3" style={{ color: 'var(--card-foreground)' }}>
                {t('dashboard.column_cpu')}
              </th>
              <th className="text-left px-4 py-3" style={{ color: 'var(--card-foreground)' }}>
                {t('dashboard.column_memory')}
              </th>
              <th className="text-left px-4 py-3" style={{ color: 'var(--card-foreground)' }}>
                {t('dashboard.column_actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0
              ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-sm">
                      {t('dashboard.tip.empty_sessions')}
                    </td>
                  </tr>
                )
              : projects.map(project => (
                  <tr key={project.id} className="border-b border-border last:border-0 hover:bg-accent transition-colors">
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--card-foreground)' }}>{project.name}</td>
                    <td className="px-4 py-3 text-sm truncate" style={{ color: 'var(--card-foreground)' }}>
                      {project.servers || t('dashboard.servers_fallback')}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--card-foreground)' }}>{project.cpu}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--card-foreground)' }}>{project.memory}</td>
                    <td className="px-4 py-3">
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
                          <Eye className="w-4 h-4" style={{ color: 'var(--card-foreground)' }} />
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
                          <X className="w-4 h-4" style={{ color: 'var(--card-foreground)' }} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

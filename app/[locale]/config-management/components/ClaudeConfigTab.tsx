'use client'

import { Download, Edit, FileText, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ClaudeConfig,
  deleteClaudeConfig,
  getAllClaudeConfigs,
  setActiveClaudeConfig,
} from '@/plugins/db'
import { applyClaudeConfig } from '@/utils/tauri/config'
import { defaultClaudeConfig } from '../config/defaultConfigs'
import { ConfigDialog } from './ConfigDialog'
import { FileConfigViewer } from './FileConfigViewer'

export function ClaudeConfigTab() {
  const { t } = useTranslation(['config'])
  const [configs, setConfigs] = useState<ClaudeConfig[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ClaudeConfig | null>(null)
  const [fileViewerOpen, setFileViewerOpen] = useState(false)

  const loadConfigs = async () => {
    const data = await getAllClaudeConfigs()
    setConfigs(data)
  }

  useEffect(() => {
    loadConfigs()
  }, [])

  const handleDelete = async (id: number) => {
    try {
      await deleteClaudeConfig(id)
      await loadConfigs()
      toast.success(t('config.config_deleted'))
    }
    catch (error: any) {
      toast.error(error.message || t('config.tip.failed_to_delete'))
      console.error(error)
    }
  }

  const handleEdit = (config: ClaudeConfig) => {
    setEditingConfig(config)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingConfig(null)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingConfig(null)
    loadConfigs()
  }

  const handleApply = async (config: ClaudeConfig) => {
    try {
      const result = await applyClaudeConfig({
        env: config.settingsConfig.env,
      })

      if (result) {
        toast.success(t('config.tip.config_applied_with_backup', { path: result.backup_path }))
      }
      else {
        toast.success(t('config.config_applied'))
      }

      // Activate config after applying
      if (config.id) {
        await setActiveClaudeConfig(config.id)
        await loadConfigs()
      }
    }
    catch (error: any) {
      toast.error(error || t('config.tip.failed_to_apply'))
      console.error(error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {t('config.tip.claude')}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFileViewerOpen(true)}>
            <FileText className="h-4 w-4" />
            {t('config.view_file_config')}
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="mh-4 w-4" />
            {t('config.add_config')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {configs.map(config => (
          <Card key={config.id} className={config.isActive ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {config.name}
                  </CardTitle>
                  <CardDescription>
                    {t('config.created', { date: new Date(config.createdAt).toLocaleDateString() })}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApply(config)}
                >
                  <Download className="h-4 w-4" />
                  {t('config.apply')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(config)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => config.id && handleDelete(config.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfigDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        type="claude"
        config={editingConfig}
        defaultConfig={defaultClaudeConfig}
      />

      <FileConfigViewer
        open={fileViewerOpen}
        onClose={() => setFileViewerOpen(false)}
        type="claude"
      />
    </div>
  )
}

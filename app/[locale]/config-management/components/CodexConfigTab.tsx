'use client'

import { Download, Edit, FileText, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type CodexConfig,
  deleteCodexConfig,
  getAllCodexConfigs,
  setActiveCodexConfig,
} from '@/plugins/db'
import { applyCodexConfig } from '@/utils/tauri/config'
import { defaultCodexConfig } from '../config/defaultConfigs'
import { ConfigDialog } from './ConfigDialog'
import { FileConfigViewer } from './FileConfigViewer'

export function CodexConfigTab() {
  const { t } = useTranslation(['config'])
  const [configs, setConfigs] = useState<CodexConfig[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<CodexConfig | null>(null)
  const [fileViewerOpen, setFileViewerOpen] = useState(false)

  const loadConfigs = async () => {
    const data = await getAllCodexConfigs()
    setConfigs(data)
  }

  useEffect(() => {
    loadConfigs()
  }, [])

  const handleDelete = async (id: number) => {
    try {
      await deleteCodexConfig(id)
      await loadConfigs()
      toast.success(t('config.config_deleted'))
    }
    catch (error: any) {
      toast.error(error.message || t('config.tip.failed_to_delete'))
      console.error(error)
    }
  }

  const handleEdit = (config: CodexConfig) => {
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

  const handleApply = async (config: CodexConfig) => {
    try {
      const result = await applyCodexConfig(config.auth, config.config)

      if (result.authBackup || result.configBackup) {
        toast.success(t('config.config_applied'))
      }
      else {
        toast.success(t('config.config_applied'))
      }

      if (config.id) {
        await setActiveCodexConfig(config.id)
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
          {t('config.tip.codex')}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFileViewerOpen(true)}>
            <FileText className="h-4 w-4" />
            {t('config.view_file_config')}
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4" />
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
                  {t('apply')}
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
        type="codex"
        config={editingConfig}
        defaultConfig={defaultCodexConfig}
      />

      <FileConfigViewer
        open={fileViewerOpen}
        onClose={() => setFileViewerOpen(false)}
        type="codex"
      />
    </div>
  )
}

'use client'

import type { ToolConfigType } from '@/plugins/db'
import { Loader2, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CodeEditor } from '@/components/CodeEditor'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { applyConfigToFile, readConfigFile } from '@/utils/tauri/config'

interface FileConfigViewerProps {
  open: boolean
  onClose: () => void
  type: ToolConfigType
}

export function FileConfigViewer({ open, onClose, type }: FileConfigViewerProps) {
  const { t } = useTranslation(['config'])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fileContent, setFileContent] = useState('')
  const [authContent, setAuthContent] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  const isCodex = type === 'codex'

  const loadFileContent = async () => {
    setLoading(true)
    setHasChanges(false)
    try {
      if (isCodex) {
        const [auth, config] = await Promise.all([
          readConfigFile('codex_auth' as ToolConfigType),
          readConfigFile('codex_config' as ToolConfigType),
        ])
        setAuthContent(auth || '{}')
        setFileContent(config || '')
      }
      else {
        const content = await readConfigFile(type)
        setFileContent(content || '{}')
      }
    }
    catch (error: any) {
      toast.error(error || t('config.tip.failed_to_read_file'))
      console.error(error)
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadFileContent()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isCodex) {
        await Promise.all([
          applyConfigToFile('codex_auth' as ToolConfigType, authContent, true),
          applyConfigToFile('codex_config' as ToolConfigType, fileContent, true),
        ])
      }
      else {
        await applyConfigToFile(type, fileContent, true)
      }
      toast.success(t('config.config_saved'))
      setHasChanges(false)
    }
    catch (error: any) {
      toast.error(error || t('config.tip.failed_to_save'))
      console.error(error)
    }
    finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]! flex flex-col">
        <DialogHeader>
          <DialogTitle>{t(`config.${type}_file_config_title`)}</DialogTitle>
          <DialogDescription>
            {t('config.tip.file_config_description', { path: t(`config.tip.${type}_config_path`) })}
          </DialogDescription>
        </DialogHeader>

        {loading
          ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )
          : (
              <div className="flex-1 min-h-0 overflow-y-auto py-4">
                {isCodex
                  ? (
                      <div className="space-y-4 px-1">
                        <CodeEditor
                          value={authContent}
                          onChange={(val) => {
                            setAuthContent(val)
                            setHasChanges(true)
                          }}
                          language="json"
                          title={t('config.auth_label')}
                          height="250px"
                        />

                        <CodeEditor
                          value={fileContent}
                          onChange={(val) => {
                            setFileContent(val)
                            setHasChanges(true)
                          }}
                          language="toml"
                          title={t('config.config_label')}
                          height="350px"
                        />
                      </div>
                    )
                  : (
                      <div className="px-1">
                        <CodeEditor
                          value={fileContent}
                          onChange={(val) => {
                            setFileContent(val)
                            setHasChanges(true)
                          }}
                          language="json"
                          title={t('config.content_label')}
                          height="500px"
                        />
                      </div>
                    )}
              </div>
            )}

        <DialogFooter className="flex gap-2 items-center justify-end">
          <Button variant="outline" onClick={onClose}>
            {t('config.close')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            {t('config.save_changes')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

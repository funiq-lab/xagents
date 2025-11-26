'use client'

import type { ClaudePreset } from '../config/presets/claudePresets'
import type { CodexPreset } from '../config/presets/codexPresets'
import type { GeminiPreset } from '../config/presets/geminiPresets'
import { FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CodeEditor } from '@/components/CodeEditor'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  type ClaudeConfig,
  type CodexConfig,
  createClaudeConfig,
  createCodexConfig,
  createGeminiConfig,
  type GeminiConfig,
  type ToolConfigType,
  updateClaudeConfig,
  updateCodexConfig,
  updateGeminiConfig,
} from '@/plugins/db'
import { TemplateSelector } from './TemplateSelector'

type ConfigType = ClaudeConfig | CodexConfig | GeminiConfig

interface ConfigDialogProps {
  open: boolean
  onClose: () => void
  type: ToolConfigType
  config: ConfigType | null
  defaultConfig: Omit<ConfigType, 'id' | 'createdAt' | 'updatedAt'>
}

export function ConfigDialog({ open, onClose, type, config, defaultConfig }: ConfigDialogProps) {
  const { t } = useTranslation(['config'])
  const [name, setName] = useState('')
  const [configData, setConfigData] = useState('')
  const [authData, setAuthData] = useState('')
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false)

  const isEditing = !!config

  useEffect(() => {
    if (config) {
      setName(config.name)
      if (type === 'codex') {
        const codexConfig = config as CodexConfig
        setConfigData(codexConfig.config || '')
        setAuthData(JSON.stringify(codexConfig.auth || {}, null, 2))
      }
      else {
        const envConfig = config as ClaudeConfig | GeminiConfig
        setConfigData(JSON.stringify(envConfig.settingsConfig || {}, null, 2))
      }
    }
    else {
      setName('')
      if (type === 'codex') {
        const codexDefault = defaultConfig as Omit<CodexConfig, 'id' | 'createdAt' | 'updatedAt'>
        setConfigData(codexDefault.config || '')
        setAuthData(JSON.stringify(codexDefault.auth || {}, null, 2))
      }
      else {
        const envDefault = defaultConfig as Omit<ClaudeConfig | GeminiConfig, 'id' | 'createdAt' | 'updatedAt'>
        setConfigData(JSON.stringify(envDefault.settingsConfig || {}, null, 2))
      }
    }
  }, [config, type, defaultConfig])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t('config.tip.config_name_placeholder'))
      return
    }

    try {
      if (type === 'codex') {
        const authObj = authData.trim() ? JSON.parse(authData) : {}
        const data = {
          name: name.trim(),
          isActive: false,
          auth: authObj,
          config: configData,
        }

        if (isEditing && config?.id) {
          await updateCodexConfig(config.id, data)
          toast.success(t('config.config_saved'))
        }
        else {
          await createCodexConfig(data)
          toast.success(t('config.config_saved'))
        }
      }
      else {
        const settingsObj = configData.trim() ? JSON.parse(configData) : {}
        const data = {
          name: name.trim(),
          isActive: false,
          settingsConfig: settingsObj,
        }

        if (type === 'claude') {
          if (isEditing && config?.id) {
            await updateClaudeConfig(config.id, data)
            toast.success(t('config.config_saved'))
          }
          else {
            await createClaudeConfig(data)
            toast.success(t('config.config_saved'))
          }
        }
        else if (type === 'gemini') {
          if (isEditing && config?.id) {
            await updateGeminiConfig(config.id, data)
            toast.success(t('config.config_saved'))
          }
          else {
            await createGeminiConfig(data)
            toast.success(t('config.config_saved'))
          }
        }
      }

      onClose()
    }
    catch (error: any) {
      toast.error(error.message || t('config.tip.failed_to_save'))
      console.error(error)
    }
  }

  const handleTemplateSelect = (preset: ClaudePreset | CodexPreset | GeminiPreset) => {
    setName(preset.name)

    if (type === 'codex') {
      const codexPreset = preset as CodexPreset
      setAuthData(JSON.stringify(codexPreset.auth, null, 2))
      setConfigData(codexPreset.config)
    }
    else {
      const envPreset = preset as ClaudePreset | GeminiPreset
      setConfigData(JSON.stringify(envPreset.settingsConfig, null, 2))
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh]! flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEditing ? t(`config.edit_${type}_title`) : t(`config.add_${type}_title`)}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Edit configuration' : 'Create new configuration'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto py-4">
            <div className="space-y-4 px-1">
              {!isEditing && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTemplateSelectorOpen(true)}
                  >
                    <FileText className="h-4 w-4" />
                    {t('config.select_template')}
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">{t('config.config_name')}</Label>
                <Input
                  id="name"
                  placeholder={t('config.tip.config_name_placeholder')}
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              {type === 'codex'
                ? (
                    <div className="space-y-4">
                      <CodeEditor
                        value={authData}
                        onChange={setAuthData}
                        language="json"
                        title={t('config.auth_config')}
                        placeholder='{"OPENAI_API_KEY": "your-key"}'
                        height="200px"
                      />

                      <CodeEditor
                        value={configData}
                        onChange={setConfigData}
                        language="toml"
                        title={t('config.config_content')}
                        placeholder="model_provider = ..."
                        height="300px"
                      />
                    </div>
                  )
                : (
                    <CodeEditor
                      value={configData}
                      onChange={setConfigData}
                      language="json"
                      title={t('config.settings_config')}
                      placeholder='{"env": {"KEY": "value"}}'
                      height="400px"
                    />
                  )}
            </div>
          </div>

          <DialogFooter className="flex gap-2 items-center justify-end">
            <Button variant="outline" onClick={onClose}>
              {t('config.cancel')}
            </Button>
            <Button onClick={handleSave}>
              {t('config.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TemplateSelector
        open={templateSelectorOpen}
        onClose={() => setTemplateSelectorOpen(false)}
        type={type}
        onSelect={handleTemplateSelect}
      />
    </>
  )
}

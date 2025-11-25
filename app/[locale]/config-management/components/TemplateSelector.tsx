'use client'

import type { ToolConfigType } from '@/plugins/db'
import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type ClaudePreset, claudePresets } from '../config/presets/claudePresets'
import { type CodexPreset, codexPresets } from '../config/presets/codexPresets'
import { type GeminiPreset, geminiPresets } from '../config/presets/geminiPresets'

type PresetType = ClaudePreset | CodexPreset | GeminiPreset

interface TemplateSelectorProps {
  open: boolean
  onClose: () => void
  type: ToolConfigType
  onSelect: (preset: PresetType) => void
}

export function TemplateSelector({ open, onClose, type, onSelect }: TemplateSelectorProps) {
  const { t } = useTranslation(['config'])
  const [_selectedPreset, setSelectedPreset] = useState<PresetType | null>(null)

  const presets = type === 'claude'
    ? claudePresets
    : type === 'codex'
      ? codexPresets
      : geminiPresets

  const handleSelect = (preset: PresetType) => {
    setSelectedPreset(preset)
    onSelect(preset)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t('config.tip.template_selector_title')}</DialogTitle>
          <DialogDescription>
            {t('config.tip.template_selector_description')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="grid gap-4 md:grid-cols-2">
            {presets.map(preset => (
              <Card
                key={`template-${preset.name}`}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSelect(preset)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-base">
                        {preset.name}
                      </CardTitle>
                      {preset.description && (
                        <CardDescription className="text-sm">
                          {t(preset.description)}
                        </CardDescription>
                      )}
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {preset.websiteUrl && (
                          <a
                            href={preset.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary"
                            onClick={e => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                            {t('config.tip.website')}
                          </a>
                        )}
                        {preset.apiKeyUrl && (
                          <a
                            href={preset.apiKeyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary"
                            onClick={e => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                            {t('config.tip.get_api_key')}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

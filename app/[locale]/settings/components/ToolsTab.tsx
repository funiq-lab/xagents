'use client'

import type { BuiltinCliTool } from '@/types/tools'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface ToolsTabProps {
  platform: string
  availableCliTools: BuiltinCliTool[]
  selectedCliTool?: BuiltinCliTool
  onSelectCliTool: (toolId: string) => void
}

export function ToolsTab({
  platform,
  availableCliTools,
  selectedCliTool,
  onSelectCliTool,
}: ToolsTabProps) {
  const { t } = useTranslation(['global', 'settings'])

  const platformLabel = t(`settings.${platform}` as const)

  return (
    <div className="space-y-4 overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.card_title')}</CardTitle>
          <CardDescription>
            {t('settings.tip.card_description', {
              platform: platformLabel,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* IDE Tools (Built-in, not configurable) */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">
                {t('settings.ide_tools_title')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('settings.ide_tools_description')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                <div className="flex-1">
                  <p className="font-medium">VSCode</p>
                  <p className="text-xs text-muted-foreground">code</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                <div className="flex-1">
                  <p className="font-medium">Cursor</p>
                  <p className="text-xs text-muted-foreground">cursor</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('settings.ide_tools_note')}
            </p>
          </div>

          <Separator />

          {/* CLI Tool Selection */}
          {availableCliTools.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold">
                  {t('settings.cli_terminal_title')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('settings.cli_terminal_description')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableCliTools.map(tool => (
                  <button
                    type="button"
                    key={tool.id}
                    onClick={() => onSelectCliTool(tool.id)}
                    className={`
                      relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                      ${
                  selectedCliTool?.id === tool.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                  }
                    `}
                  >
                    <div className="flex-1 text-left">
                      <p className="font-medium">{tool.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {tool.appName || tool.command}
                      </p>
                    </div>
                    {selectedCliTool?.id === tool.id && (
                      <Check className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                {t('settings.cli_tools_note')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

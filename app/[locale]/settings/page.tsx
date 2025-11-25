'use client'

import type { NotificationConfig } from '../db'
import { Check, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSettingsStore } from '../stores'

export default function SettingsPage() {
  const { t } = useTranslation(['global', 'settings'])

  const {
    platform,
    availableCliTools,
    selectedCliTool,
    notificationConfig,
    selectCliTool,
    updateNotificationConfig,
    initialize,
  } = useSettingsStore()

  const [localNotificationConfig, setLocalNotificationConfig] = useState<NotificationConfig | null>(null)
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)

  const platformLabel = t(`settings.${platform}` as const)
  const featureItems = useMemo(
    () => t('settings.about_features', { returnObjects: true }) as string[],
    [t],
  )

  // Initialize stores
  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (notificationConfig) {
      setLocalNotificationConfig(notificationConfig)
    }
  }, [notificationConfig])

  const handleSelectCliTool = async (toolId: string) => {
    try {
      await selectCliTool(toolId)
      toast.success(t('settings.tip.cli_tool_changed'))
    }
    catch (error) {
      console.error('[Settings] Select CLI tool failed:', error)
      toast.error(t('settings.tip.cli_tool_change_failed'), {
        description:
          error instanceof Error
            ? error.message
            : t('global.tip.unknown_error'),
      })
    }
  }

  // Save notification configuration
  const handleSaveNotificationConfig = async () => {
    if (!localNotificationConfig)
      return

    setIsSavingNotifications(true)
    try {
      await updateNotificationConfig(localNotificationConfig)
      toast.success(t('settings.notifications_save_success'))
    }
    catch (error) {
      console.error('[Settings] Save notification config failed:', error)
      toast.error(t('settings.notifications_save_failed'), {
        description:
          error instanceof Error
            ? error.message
            : t('global.tip.unknown_error'),
      })
    }
    finally {
      setIsSavingNotifications(false)
    }
  }

  if (!localNotificationConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">{t('global.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl flex flex-col gap-4 overflow-hidden">
      <Tabs defaultValue="tools" className="space-y-6 overflow-hidden flex-1">
        <TabsList>
          <TabsTrigger value="tools">{t('settings.tools')}</TabsTrigger>
          <TabsTrigger value="notification">{t('settings.notification')}</TabsTrigger>
          <TabsTrigger value="about">{t('settings.about')}</TabsTrigger>
        </TabsList>

        {/* Tool configuration */}
        <TabsContent value="tools" className="space-y-4 overflow-y-auto">
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
                        onClick={() => handleSelectCliTool(tool.id)}
                        className={`
                          relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                          ${selectedCliTool?.id === tool.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-accent'}
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
        </TabsContent>

        {/* Notification configuration */}
        <TabsContent value="notification" className="space-y-4  overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.notifications_title')}</CardTitle>
              <CardDescription>{t('settings.notifications_description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Master toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.notifications_mainToggle_label')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.notifications_main_toggle_description')}
                  </p>
                </div>
                <Switch
                  checked={localNotificationConfig.enabled}
                  onCheckedChange={checked =>
                    setLocalNotificationConfig({
                      ...localNotificationConfig,
                      enabled: checked,
                    })}
                />
              </div>

              <Separator />

              {/* Notification types */}
              <div className="space-y-4">
                <Label>{t('settings.notifications_types_label')}</Label>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-normal">
                      {t('settings.notifications_complete_label')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.notifications_complete_description')}
                    </p>
                  </div>
                  <Switch
                    checked={localNotificationConfig.taskComplete}
                    onCheckedChange={checked =>
                      setLocalNotificationConfig({
                        ...localNotificationConfig,
                        taskComplete: checked,
                      })}
                    disabled={!localNotificationConfig.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-normal">
                      {t('settings.notifications_failed_label')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.notifications_failed_description')}
                    </p>
                  </div>
                  <Switch
                    checked={localNotificationConfig.taskFailed}
                    onCheckedChange={checked =>
                      setLocalNotificationConfig({
                        ...localNotificationConfig,
                        taskFailed: checked,
                      })}
                    disabled={!localNotificationConfig.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-normal">
                      {t('settings.notifications_resource_label')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.notifications_resource_description')}
                    </p>
                  </div>
                  <Switch
                    checked={localNotificationConfig.resourceAlert}
                    onCheckedChange={checked =>
                      setLocalNotificationConfig({
                        ...localNotificationConfig,
                        resourceAlert: checked,
                      })}
                    disabled={!localNotificationConfig.enabled}
                  />
                </div>
              </div>

              {/* Save button */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveNotificationConfig} disabled={isSavingNotifications}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingNotifications ? t('global.loading') : t('settings.notifications_save_button')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About section */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.about_title')}</CardTitle>
              <CardDescription>{t('settings.about_description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4  overflow-y-auto">
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">{t('settings.about_version_label')}</span>
                  {' '}
                  0.1.0
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.about_summary')}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-semibold">{t('settings.about_features_title')}</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  {featureItems.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

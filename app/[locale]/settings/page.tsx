'use client'

import type { NotificationConfig, ToolLaunchConfig } from '../db'
import { ArrowLeft, RotateCcw, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSettingsStore } from '../stores'

export default function SettingsPage() {
  const router = useRouter()
  const { t } = useTranslation(['global', 'settings'])

  const {
    toolConfigs,
    toolPlatform,
    notificationConfig,
    updateToolConfigs,
    resetToolConfigs,
    updateNotificationConfig,
    initialize,
  } = useSettingsStore()

  const [localToolConfigs, setLocalToolConfigs] = useState<ToolLaunchConfig[]>([])
  const [localNotificationConfig, setLocalNotificationConfig] = useState<NotificationConfig | null>(null)

  const [isSavingTools, setIsSavingTools] = useState(false)
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)
  const platformLabel = t(`settings.${toolPlatform}` as const)
  const featureItems = useMemo(
    () => t('settings.about_features', { returnObjects: true }) as string[],
    [t],
  )

  // Initialize stores
  useEffect(() => {
    initialize()
  }, [initialize])

  // Sync tool configuration
  useEffect(() => {
    if (toolConfigs.length > 0) {
      setLocalToolConfigs(toolConfigs)
    }
  }, [toolConfigs])

  useEffect(() => {
    if (notificationConfig) {
      setLocalNotificationConfig(notificationConfig)
    }
  }, [notificationConfig])

  const handleSaveToolConfigs = async () => {
    if (!localToolConfigs.length)
      return

    setIsSavingTools(true)
    try {
      await updateToolConfigs(localToolConfigs)
      toast.success(t('settings.tip.save_success'))
    }
    catch (error) {
      console.error('[Settings] Save tool configs failed:', error)
      toast.error(t('settings.tip.save_failed'), {
        description:
          error instanceof Error
            ? error.message
            : t('global.tip.unknown_error'),
      })
    }
    finally {
      setIsSavingTools(false)
    }
  }

  const handleResetToolConfigs = async () => {
    setIsSavingTools(true)
    try {
      const defaults = await resetToolConfigs()
      setLocalToolConfigs(defaults)
      toast.success(t('settings.tip.reset_success'))
    }
    catch (error) {
      console.error('[Settings] Reset tool configs failed:', error)
      toast.error(t('settings.tip.reset_failed'), {
        description:
          error instanceof Error
            ? error.message
            : t('global.tip.unknown_error'),
      })
    }
    finally {
      setIsSavingTools(false)
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

  if (!localToolConfigs.length || !localNotificationConfig) {
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
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('settings.settings')}</h1>
          <p className="text-muted-foreground mt-1">{t('settings.tip.settings_description')}</p>
        </div>
      </div>

      <Tabs defaultValue="tools" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tools">{t('settings.tools')}</TabsTrigger>
          <TabsTrigger value="notification">{t('settings.notification')}</TabsTrigger>
          <TabsTrigger value="about">{t('settings.about')}</TabsTrigger>
        </TabsList>

        {/* Tool configuration */}
        <TabsContent value="tools" className="space-y-4">
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
              <p className="text-sm text-muted-foreground">
                {t('settings.tip.tools_intro')}
              </p>

              {(['ide', 'cli'] as const).map((group) => {
                const items = localToolConfigs.filter(tool => tool.type === group)
                if (items.length === 0)
                  return null

                return (
                  <div key={group} className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold">
                        {group === 'ide'
                          ? t('settings.ide')
                          : t('settings.cli')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {group === 'ide'
                          ? t('settings.tip.ide_desc')
                          : t('settings.tip.cli_desc')}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {items.map(tool => (
                        <div key={tool.id} className="space-y-4 rounded-lg border p-4">
                          <div className="flex flex-col gap-1">
                            <h4 className="font-semibold">{tool.label}</h4>
                            <p className="text-xs text-muted-foreground">
                              {t('settings.tip.tool_summary')}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>{t('settings.fields_command')}</Label>
                            <Input
                              value={tool.command}
                              onChange={e =>
                                setLocalToolConfigs(configs =>
                                  configs.map(item =>
                                    item.id === tool.id
                                      ? { ...item, command: e.target.value }
                                      : item,
                                  ))}
                              className="font-mono text-sm"
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>{t('settings.fields_display')}</Label>
                              <Input
                                value={tool.displayName}
                                onChange={e =>
                                  setLocalToolConfigs(configs =>
                                    configs.map(item =>
                                      item.id === tool.id
                                        ? { ...item, displayName: e.target.value }
                                        : item,
                                    ))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('settings.fields_process')}</Label>
                              <Input
                                value={tool.processName}
                                onChange={e =>
                                  setLocalToolConfigs(configs =>
                                    configs.map(item =>
                                      item.id === tool.id
                                        ? { ...item, processName: e.target.value }
                                        : item,
                                    ))}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              <Separator />

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetToolConfigs}
                  disabled={isSavingTools}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('settings.reset')}
                </Button>
                <Button onClick={handleSaveToolConfigs} disabled={isSavingTools}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingTools ? t('global.loading') : t('settings.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification configuration */}
        <TabsContent value="notification" className="space-y-4">
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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">{t('settings.about_version_label')}</span>
                  {' '}
                  0.1.0
                </p>
                <p className="text-sm">
                  <span className="font-semibold">{t('settings.about_stack_label')}</span>
                  {' '}
                  Tauri 2.x + React 19 + Next.js 15
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

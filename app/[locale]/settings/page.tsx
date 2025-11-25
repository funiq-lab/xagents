'use client'

import type { NotificationConfig } from '@/plugins/db'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSettingsStore } from '../stores'
import { AboutTab } from './components/AboutTab'
import { NotificationTab } from './components/NotificationTab'
import { ToolsTab } from './components/ToolsTab'

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

        <TabsContent value="tools">
          <ToolsTab
            platform={platform}
            availableCliTools={availableCliTools}
            selectedCliTool={selectedCliTool}
            onSelectCliTool={handleSelectCliTool}
          />
        </TabsContent>

        <TabsContent value="notification">
          <NotificationTab
            notificationConfig={localNotificationConfig}
            onUpdateConfig={setLocalNotificationConfig}
            onSave={handleSaveNotificationConfig}
            isSaving={isSavingNotifications}
          />
        </TabsContent>

        <TabsContent value="about">
          <AboutTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

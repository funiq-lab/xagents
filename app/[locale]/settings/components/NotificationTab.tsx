'use client'

import type { NotificationConfig } from '@/plugins/db'
import { Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

interface NotificationTabProps {
  notificationConfig: NotificationConfig
  onUpdateConfig: (config: NotificationConfig) => void
  onSave: () => void
  isSaving: boolean
}

export function NotificationTab({
  notificationConfig,
  onUpdateConfig,
  onSave,
  isSaving,
}: NotificationTabProps) {
  const { t } = useTranslation(['global', 'settings'])

  return (
    <div className="space-y-4 overflow-y-auto">
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
              checked={notificationConfig.enabled}
              onCheckedChange={checked =>
                onUpdateConfig({
                  ...notificationConfig,
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
                checked={notificationConfig.taskComplete}
                onCheckedChange={checked =>
                  onUpdateConfig({
                    ...notificationConfig,
                    taskComplete: checked,
                  })}
                disabled={!notificationConfig.enabled}
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
                checked={notificationConfig.taskFailed}
                onCheckedChange={checked =>
                  onUpdateConfig({
                    ...notificationConfig,
                    taskFailed: checked,
                  })}
                disabled={!notificationConfig.enabled}
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
                checked={notificationConfig.resourceAlert}
                onCheckedChange={checked =>
                  onUpdateConfig({
                    ...notificationConfig,
                    resourceAlert: checked,
                  })}
                disabled={!notificationConfig.enabled}
              />
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-4">
            <Button onClick={onSave} disabled={isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? t('global.loading') : t('settings.notifications_save_button')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

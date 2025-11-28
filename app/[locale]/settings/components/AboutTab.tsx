'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import packageInfo from '../../../../package.json'

export function AboutTab() {
  const { t } = useTranslation(['global', 'settings'])

  const featureItems = useMemo(
    () => t('settings.about_features', { returnObjects: true }) as string[],
    [t],
  )

  return (
    <div className="overflow-y-auto">
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
              {packageInfo.version}
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
    </div>
  )
}

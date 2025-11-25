'use client'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import LangSelect from './LangSelect'
import ThemeModeToggle from './ThemeModeToggle'

export function PageHeader() {
  const pathname = usePathname()
  const { t } = useTranslation(['global'])

  const labelMap = useMemo<Record<string, string>>(() => ({
    'config-management': t('global.config_management'),
    'dashboard': t('global.dashboard'),
    'projects': t('global.projects'),
    'settings': t('global.settings'),
  }), [t])

  const currentLabel = useMemo(() => {
    const segments = pathname?.split('/').filter(Boolean) ?? []
    const last = segments[segments.length - 1] || 'dashboard'
    return labelMap[last] ?? labelMap.dashboard
  }, [pathname, labelMap])

  return (
    <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-2">
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="capitalize font-semibold">
              {currentLabel}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Separator orientation="vertical" className="h-4" />
      <LangSelect />
      <ThemeModeToggle />
    </header>
  )
}

'use client'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import LangSelect from './LangSelect'
import ThemeModeToggle from './ThemeModeToggle'

export function PageHeader() {
  const pathname = usePathname()
  const { t } = useTranslation(['global'])

  const labelMap = useMemo<Record<string, string>>(() => ({
    dashboard: t('global.dashboard'),
    projects: t('global.projects'),
    settings: t('global.settings'),
  }), [t])

  const currentLabel = useMemo(() => {
    const segments = pathname?.split('/').filter(Boolean) ?? []
    const last = segments[segments.length - 1] || 'dashboard'
    return labelMap[last] ?? labelMap.dashboard
  }, [pathname, labelMap])

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 bg-background">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="capitalize font-semibold">
              {currentLabel}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Separator orientation="vertical" className="mr-2 h-4" />
      <LangSelect />
      <ThemeModeToggle />
    </header>
  )
}

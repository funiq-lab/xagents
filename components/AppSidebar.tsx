'use client'

import { FolderKanban, LayoutDashboard, Settings, Wrench } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Logo } from './SiteLogo'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar'

interface AppSidebarProps {
  locale: string
}

export function AppSidebar({ locale }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation(['global'])

  const navItems = useMemo(() => [
    {
      key: 'dashboard',
      label: t('global.dashboard'),
      icon: LayoutDashboard,
      href: (targetLocale: string) => `/${targetLocale}/dashboard`,
    },
    {
      key: 'projects',
      label: t('global.projects'),
      icon: FolderKanban,
      href: (targetLocale: string) => `/${targetLocale}/projects`,
    },
    {
      key: 'config-management',
      label: t('global.config_management'),
      icon: Wrench,
      href: (targetLocale: string) => `/${targetLocale}/config-management`,
    },
  ], [t])

  const activeKey = useMemo(() => {
    if (!pathname)
      return 'dashboard'

    if (pathname.includes('/projects'))
      return 'projects'
    if (pathname.includes('/dashboard'))
      return 'dashboard'
    if (pathname.includes('/config-management'))
      return 'config-management'
    if (pathname.includes('/settings'))
      return 'settings'
    return 'dashboard'
  }, [pathname])

  const navigate = (href: string) => {
    router.push(href)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="size-full flex items-center justify-center">
                <Logo className="h-6 w-6" />
              </div>

            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={activeKey === item.key}
                    onClick={() => navigate(item.href(locale))}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={activeKey === 'settings'} tooltip={t('global.settings')} onClick={() => navigate(`/${locale}/settings`)}>
              <Settings />
              <span>{t('global.settings')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

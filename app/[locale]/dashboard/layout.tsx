import React from 'react'
import { AppSidebar } from '@/components/AppSidebar'
import { PageHeader } from '@/components/PageHeader'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{
    locale: string
  }>
}>) {
  const locale = (await params).locale
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar locale={locale} />
      <SidebarInset className="overflow-hidden">
        <PageHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

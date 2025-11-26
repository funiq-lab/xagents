import { Roboto } from 'next/font/google'
import { notFound } from 'next/navigation'
import React from 'react'
import { AppSidebar } from '@/components/AppSidebar'
import { EventListeners } from '@/components/EventListeners'
import { PageHeader } from '@/components/PageHeader'
import Providers from '@/components/Providers'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import i18nConfig from '@/i18nConfig'
import { languages } from '@/plugins/i18n/settings'
import './globals.css'

export const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
  preload: true,
})

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: 'cover',
}

export async function generateStaticParams() {
  return languages.map(lang => ({ locale: lang }))
}

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
  if (!i18nConfig.locales.includes(locale)) {
    notFound()
  }

  return (
    <React.StrictMode>
      <html lang={locale} className={roboto.variable} suppressHydrationWarning>
        <body className="w-full h-svh overflow-hidden">
          <Providers>
            <SidebarProvider defaultOpen={false}>
              <AppSidebar locale={locale} />
              <SidebarInset className="overflow-hidden">
                <PageHeader />
                {children}
              </SidebarInset>
            </SidebarProvider>
            {children}
          </Providers>
          <EventListeners />
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </React.StrictMode>
  )
}

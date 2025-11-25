'use client'
import type { Locale } from '@/plugins/i18n/settings'
import { AppProgressProvider as ProgressProvider } from '@bprogress/next'

import { ThemeProvider } from 'next-themes'
import { useParams } from 'next/navigation'
import { I18nextProvider } from 'react-i18next'
import i18next from '@/plugins/i18n/i18next'
import { setDayJsLang } from '@/utils/time'
import { MessageBoxProvider } from './MessageBox'

interface ProvidersProps {
  children: React.ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  const { locale } = useParams()
  setDayJsLang(locale as Locale)
  return (

    <I18nextProvider i18n={i18next}>
      <ProgressProvider options={{ showSpinner: false }}>
        <ThemeProvider attribute="class" enableSystem defaultTheme="dark">
          <MessageBoxProvider>
            {children}
          </MessageBoxProvider>
        </ThemeProvider>
      </ProgressProvider>
    </I18nextProvider>

  )
}

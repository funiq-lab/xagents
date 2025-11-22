import LangSelect from '@/components/LangSelect'
import ThemeModeToggle from '@/components/ThemeModeToggle'
import { getTranslation } from '@/plugins/i18n'
import { languages } from '@/plugins/i18n/settings'

export async function generateStaticParams() {
  return languages.map(lang => ({ locale: lang }))
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { t } = await getTranslation(locale, ['global'])

  return (
    <main className="relative flex bg-background overflow-hidden items-center justify-center size-full">
      waiting for next feature...
      <LangSelect className="absolute top-4 right-4" />
      <ThemeModeToggle className="absolute top-4 left-4" />
      { t('global.xagents') }
    </main>
  )
}

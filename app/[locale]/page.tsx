import { redirect } from 'next/navigation'
import { languages } from '@/plugins/i18n/settings'

export async function generateStaticParams() {
  return languages.map(lang => ({ locale: lang }))
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}/dashboard`)
}

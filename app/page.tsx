import { redirect } from 'next/navigation'
import { fallbackLng } from '@/plugins/i18n/settings'

export default function Home() {
  redirect(`/${fallbackLng}`)
}

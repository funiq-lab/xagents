import type { Config } from 'next-i18n-router/dist/types'
import { fallbackLng, languages, type Locale } from './plugins/i18n/settings'

const i18nConfig: Config = {
  locales: languages as Locale[],
  defaultLocale: fallbackLng,
}

export default i18nConfig

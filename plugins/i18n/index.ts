import i18next from './i18next'

export async function getTranslation(lng: string, ns: string | string[], options?: {
  keyPrefix?: string
}) {
  if (lng && i18next.resolvedLanguage !== lng) {
    await i18next.changeLanguage(lng)
  }
  if (ns && !i18next.hasLoadedNamespace(ns)) {
    await i18next.loadNamespaces(ns)
  }
  return {
    t: i18next.getFixedT(
      lng ?? i18next.resolvedLanguage as string,
      ns,
      options?.keyPrefix,
    ),
    i18n: i18next,
  }
}

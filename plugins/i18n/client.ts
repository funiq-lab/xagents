/* eslint-disable react-hooks/rules-of-hooks */
'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslation as useTranslationCore } from 'react-i18next'
import i18next from './i18next'

const runsOnServerSide = typeof window === 'undefined'

export function useTranslation(ns?: string | string[], options?: Parameters<typeof useTranslationCore>[1]) {
  const locale = useParams()?.locale
  if (typeof locale !== 'string')
    throw new Error('useTranslation is only available inside /app/[lng]')
  if (runsOnServerSide && i18next.resolvedLanguage !== locale) {
    i18next.changeLanguage(locale)
  }
  else {
    const [activeLng, setActiveLng] = useState(i18next.resolvedLanguage)
    useEffect(() => {
      if (activeLng === i18next.resolvedLanguage)
        return
      setActiveLng(i18next.resolvedLanguage)
    }, [activeLng])
    useEffect(() => {
      if (!locale || i18next.resolvedLanguage === locale)
        return
      i18next.changeLanguage(locale)
    }, [locale])
  }
  return useTranslationCore(ns, options)
}

import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { i18nRouter } from 'next-i18n-router'
import i18nConfig from './i18nConfig'

export function middleware(request: NextRequest) {
  return i18nRouter(request, i18nConfig)
}

// only applies this logic to files in the app directory
export const config = {
  matcher: '/((?!api|static|.*\\..*|_next).*)',
}

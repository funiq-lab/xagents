'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import * as React from 'react'
import { useEffect, useState } from 'react'

import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/utils/ui'

export default function ThemeModeToggle({
  className,
}: {
  className?: string
}) {
  const { t } = useTranslation(['global'])
  const { setTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)

  const handleMode = (targetMode: 'system' | 'light' | 'dark') => {
    setTheme(targetMode)
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted)
    return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('text-muted-foreground', className)}>
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('global.toggle')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleMode('system')}>
          <Monitor className="h-4 w-4" />
          <span>{t('global.system')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleMode('light')}>
          <Sun className="h-4 w-4" />
          <span>{t('global.light')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleMode('dark')}>
          <Moon className="h-4 w-4" />
          <span>{t('global.dark')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

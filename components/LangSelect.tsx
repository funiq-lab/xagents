'use client'

import { Languages } from 'lucide-react'
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
import { languagesOptions } from '@/plugins/i18n/settings'
import { cn } from '@/utils/ui'

export default function LangSelect({
  className,
}: {
  className?: string
}) {
  const { i18n } = useTranslation()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted)
    return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn('text-muted-foreground', className)}
        >
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languagesOptions.map(option => (
          <DropdownMenuItem
            key={option.value}
            className={cn(
              'cursor-pointer',
              i18n.resolvedLanguage === option.value && 'bg-accent',
            )}
            onClick={() => {
              if (i18n.resolvedLanguage === option.value)
                return
              i18n.changeLanguage(option.value)
            }}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

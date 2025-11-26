'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClaudeConfigTab } from './components/ClaudeConfigTab'
import { CodexConfigTab } from './components/CodexConfigTab'
import { GeminiConfigTab } from './components/GeminiConfigTab'

export default function ConfigManagementPage() {
  const { t } = useTranslation(['config'])
  const [activeTab, setActiveTab] = useState<'claude' | 'codex' | 'gemini'>('claude')

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('config.page_title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('config.tip.page_description')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="claude">{t('config.claude_tab')}</TabsTrigger>
          <TabsTrigger value="codex">{t('config.codex_tab')}</TabsTrigger>
          <TabsTrigger value="gemini">{t('config.gemini_tab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="claude" className="mt-6">
          <ClaudeConfigTab />
        </TabsContent>

        <TabsContent value="codex" className="mt-6">
          <CodexConfigTab />
        </TabsContent>

        <TabsContent value="gemini" className="mt-6">
          <GeminiConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

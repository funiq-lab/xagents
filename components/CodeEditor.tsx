'use client'

import { json, jsonParseLinter } from '@codemirror/lang-json'
import { linter, lintGutter } from '@codemirror/lint'
import { EditorView } from '@codemirror/view'
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode'
import CodeMirror from '@uiw/react-codemirror'
import { Wand2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: 'json' | 'toml'
  title?: string
  height?: string
  placeholder?: string
  className?: string
}

export function CodeEditor({
  value,
  onChange,
  language,
  title,
  height = '300px',
  placeholder,
  className = '',
}: CodeEditorProps) {
  const { t } = useTranslation(['config'])
  const { theme } = useTheme()
  const [editorValue, setEditorValue] = useState(value)

  useEffect(() => {
    setEditorValue(value)
  }, [value])

  const handleChange = (val: string) => {
    setEditorValue(val)
    onChange(val)
  }

  const handleFormat = () => {
    try {
      if (language === 'json') {
        const parsed = JSON.parse(editorValue)
        const formatted = JSON.stringify(parsed, null, 2)
        setEditorValue(formatted)
        onChange(formatted)
        toast.success(t('config.tip.format_success'))
      }
      else if (language === 'toml') {
        // TOML formatting: simple space and line break handling
        const formatted = formatToml(editorValue)
        setEditorValue(formatted)
        onChange(formatted)
        toast.success(t('config.tip.format_success'))
      }
    }
    catch (error: any) {
      toast.error(t('config.tip.format_error', { error: error.message }))
    }
  }

  const extensions = [
    EditorView.lineWrapping,
    lintGutter(),
  ]

  if (language === 'json') {
    extensions.push(json())
    extensions.push(linter(jsonParseLinter()))
  }

  // Select editor theme based on app theme
  const editorTheme = theme === 'dark' ? vscodeDark : vscodeLight

  return (
    <div className={className}>
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
            <h3 className="text-sm font-medium">{title}</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleFormat}
              title={t('config.format')}
            >
              <Wand2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        {/* Editor */}
        <CodeMirror
          value={editorValue}
          height={height}
          theme={editorTheme}
          extensions={extensions}
          onChange={handleChange}
          placeholder={placeholder}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            searchKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
      </div>
    </div>
  )
}

/**
 * Simple TOML formatter
 */
function formatToml(content: string): string {
  const lines = content.split('\n')
  const formatted: string[] = []
  let inSection = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() || ''

    // Skip empty lines
    if (!line) {
      // Add empty line between sections
      if (inSection && formatted.length > 0) {
        formatted.push('')
      }
      continue
    }

    // Handle sections
    if (line.startsWith('[') && line.endsWith(']')) {
      // Add empty line before section (except for the first one)
      if (formatted.length > 0) {
        formatted.push('')
      }
      formatted.push(line)
      inSection = true
      continue
    }

    // Handle comments
    if (line.startsWith('#')) {
      formatted.push(line)
      continue
    }

    // Handle key = value
    const match = line.match(/^([^=]+)=(.+)$/)
    if (match && match[1] && match[2]) {
      const key = match[1].trim()
      const value = match[2].trim()
      formatted.push(`${key} = ${value}`)
      continue
    }

    // Keep other lines
    formatted.push(line)
  }

  return formatted.join('\n')
}

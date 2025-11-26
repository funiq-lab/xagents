/* eslint-disable regexp/optimal-quantifier-concatenation */
/* eslint-disable regexp/no-super-linear-backtracking */
import type { ToolConfigType } from '@/plugins/db'
import { invoke } from '@tauri-apps/api/core'

export interface BackupResult {
  backup_path: string
}

/**
 * 备份配置文件
 */
export async function backupConfigFile(toolType: ToolConfigType): Promise<BackupResult> {
  return invoke<BackupResult>('backup_config_file', { toolType })
}

/**
 * 应用配置到文件
 */
export async function applyConfigToFile(
  toolType: ToolConfigType,
  content: string,
  autoBackup = true,
): Promise<BackupResult | null> {
  return invoke<BackupResult | null>('apply_config_to_file', {
    toolType,
    content,
    autoBackup,
  })
}

/**
 * 读取配置文件
 */
export async function readConfigFile(toolType: ToolConfigType): Promise<string> {
  return invoke<string>('read_config_file', { toolType })
}

/**
 * 从备份恢复配置文件
 */
export async function restoreConfigFromBackup(
  toolType: ToolConfigType,
  backupPath: string,
): Promise<void> {
  return invoke<void>('restore_config_from_backup', { toolType, backupPath })
}

/**
 * 列出所有备份文件
 */
export async function listConfigBackups(toolType: ToolConfigType): Promise<string[]> {
  return invoke<string[]>('list_config_backups', { toolType })
}

/**
 * Apply Claude config (only override env field)
 */
export async function applyClaudeConfig(config: {
  env: Record<string, string>
}): Promise<BackupResult | null> {
  // Read existing config
  const existingContent = await readConfigFile('claude')
  let existingConfig: any = {}

  if (existingContent) {
    try {
      existingConfig = JSON.parse(existingContent)
    }
    catch {
      console.error('Failed to parse existing Claude config, will create new one')
    }
  }

  // Directly override env field (one-level merge)
  const mergedConfig = {
    ...existingConfig,
    env: config.env,
  }

  const content = JSON.stringify(mergedConfig, null, 2)
  return applyConfigToFile('claude', content, true)
}

/**
 * Apply Codex config (only override corresponding keys)
 */
export async function applyCodexConfig(
  auth: Record<string, any>,
  config: string,
): Promise<{ authBackup: BackupResult | null, configBackup: BackupResult | null }> {
  // Handle auth.json - merge keys
  const existingAuthContent = await readConfigFile('codex_auth' as ToolConfigType)
  let existingAuth: Record<string, any> = {}

  if (existingAuthContent) {
    try {
      existingAuth = JSON.parse(existingAuthContent)
    }
    catch {
      console.error('Failed to parse existing Codex auth config, will create new one')
    }
  }

  // Merge auth object (only override provided keys)
  const mergedAuth = {
    ...existingAuth,
    ...auth,
  }

  const authContent = JSON.stringify(mergedAuth, null, 2)

  // Handle config.toml - use simple line-level merge
  const existingConfigContent = await readConfigFile('codex_config' as ToolConfigType)
  let mergedConfigContent = config

  if (existingConfigContent && config) {
    mergedConfigContent = mergeTomlConfig(existingConfigContent, config)
  }

  const [authBackup, configBackup] = await Promise.all([
    applyConfigToFile('codex_auth' as ToolConfigType, authContent, true),
    applyConfigToFile('codex_config' as ToolConfigType, mergedConfigContent, true),
  ])

  return { authBackup, configBackup }
}

/**
 * Simple TOML config merge (line-level)
 * Only override keys that exist in the new config, keep other keys from the original config
 */
function mergeTomlConfig(existingConfig: string, newConfig: string): string {
  const existingLines = existingConfig.split('\n')
  const newLines = newConfig.split('\n')

  // Parse key-value pairs from new config
  const newKeyValues = new Map<string, string>()
  let currentSection = ''

  newLines.forEach((line) => {
    const trimmedLine = line.trim()

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return
    }

    // Detect sections
    if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
      currentSection = trimmedLine
      return
    }

    // Parse key = value
    const match = trimmedLine.match(/^([^=]+)\s*=\s*(.+)$/)
    if (match && match[1]) {
      const key = match[1].trim()
      const fullKey = currentSection ? `${currentSection}::${key}` : key
      newKeyValues.set(fullKey, line)
    }
  })

  // Process existing config and replace matching keys
  const resultLines: string[] = []
  currentSection = ''
  const processedKeys = new Set<string>()

  existingLines.forEach((line) => {
    const trimmedLine = line.trim()

    // Keep empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      resultLines.push(line)
      return
    }

    // Detect sections
    if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
      currentSection = trimmedLine
      resultLines.push(line)
      return
    }

    // Check if replacement is needed
    const match = trimmedLine.match(/^([^=]+)\s*=\s*(.+)$/)
    if (match && match[1]) {
      const key = match[1].trim()
      const fullKey = currentSection ? `${currentSection}::${key}` : key

      if (newKeyValues.has(fullKey)) {
        resultLines.push(newKeyValues.get(fullKey)!)
        processedKeys.add(fullKey)
        return
      }
    }

    // Keep original lines
    resultLines.push(line)
  })

  // Add keys from new config that don't exist in original config
  currentSection = ''
  newLines.forEach((line) => {
    const trimmedLine = line.trim()

    if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
      currentSection = trimmedLine
      return
    }

    const match = trimmedLine.match(/^([^=]+)\s*=\s*(.+)$/)
    if (match && match[1]) {
      const key = match[1].trim()
      const fullKey = currentSection ? `${currentSection}::${key}` : key

      if (!processedKeys.has(fullKey)) {
        // Add new section if needed
        if (currentSection && !existingConfig.includes(currentSection)) {
          resultLines.push('')
          resultLines.push(currentSection)
        }
        resultLines.push(line)
        processedKeys.add(fullKey)
      }
    }
  })

  return resultLines.join('\n')
}

/**
 * Apply Gemini config (only override env field)
 */
export async function applyGeminiConfig(config: {
  env: Record<string, string>
}): Promise<BackupResult | null> {
  // Read existing config
  const existingContent = await readConfigFile('gemini')
  let existingConfig: any = {}

  if (existingContent) {
    try {
      existingConfig = JSON.parse(existingContent)
    }
    catch {
      console.error('Failed to parse existing Gemini config, will create new one')
    }
  }

  // Directly override env field (one-level merge)
  const mergedConfig = {
    ...existingConfig,
    env: config.env,
  }

  const content = JSON.stringify(mergedConfig, null, 2)
  return applyConfigToFile('gemini', content, true)
}

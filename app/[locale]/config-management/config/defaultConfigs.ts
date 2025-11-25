import type { ClaudeConfig, CodexConfig, GeminiConfig } from '@/plugins/db'

/**
 * Default Claude Code configuration
 */
export const defaultClaudeConfig: Omit<ClaudeConfig, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Claude Official',
  isActive: false,
  settingsConfig: {
    env: {},
  },
}

/**
 * Default Codex configuration
 */
export const defaultCodexConfig: Omit<CodexConfig, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'OpenAI Official',
  isActive: false,
  auth: {},
  config: '',
}

/**
 * Default Gemini configuration
 */
export const defaultGeminiConfig: Omit<GeminiConfig, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Google Official',
  isActive: false,
  settingsConfig: {
    env: {},
  },
}

/**
 * Gemini preset configuration templates
 * Reference: cc-switch project (https://github.com/farion1231/cc-switch)
 */

export interface GeminiPreset {
  name: string
  websiteUrl?: string
  apiKeyUrl?: string
  settingsConfig: {
    env: Record<string, string>
  }
  category?: 'official' | 'cn_official' | 'third_party' | 'aggregator'
  description?: string
}

export const geminiPresets: GeminiPreset[] = [
  {
    name: 'Google Official',
    websiteUrl: 'https://ai.google.dev/',
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    settingsConfig: {
      env: {},
    },
    category: 'official',
    description: 'Google 官方 Gemini API',
  },
  {
    name: 'PackyCode',
    websiteUrl: 'https://www.packyapi.com',
    apiKeyUrl: 'https://www.packyapi.com/register',
    settingsConfig: {
      env: {
        GOOGLE_GEMINI_BASE_URL: 'https://www.packyapi.com',
        GEMINI_MODEL: 'gemini-3-pro-preview',
      },
    },
    category: 'third_party',
    description: 'PackyCode API',
  },
  {
    name: '自定义',
    websiteUrl: '',
    settingsConfig: {
      env: {
        GOOGLE_GEMINI_BASE_URL: '',
        GEMINI_MODEL: 'gemini-3-pro-preview',
      },
    },
    category: 'third_party',
    description: '自定义 Gemini API 端点',
  },
]

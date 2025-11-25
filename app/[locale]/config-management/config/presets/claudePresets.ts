/**
 * Claude Code preset configuration templates
 * Reference: cc-switch project (https://github.com/farion1231/cc-switch)
 */

export interface ClaudePreset {
  name: string
  websiteUrl?: string
  apiKeyUrl?: string
  settingsConfig: {
    env: Record<string, string>
  }
  category?: 'official' | 'cn_official' | 'third_party' | 'aggregator'
  description?: string
}

export const claudePresets: ClaudePreset[] = [
  {
    name: 'Claude Official',
    websiteUrl: 'https://www.anthropic.com/claude-code',
    settingsConfig: {
      env: {},
    },
    category: 'official',
    description: 'Anthropic 官方 Claude',
  },
  {
    name: 'DeepSeek',
    websiteUrl: 'https://platform.deepseek.com',
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: 'https://api.deepseek.com/anthropic',
        ANTHROPIC_AUTH_TOKEN: '',
        ANTHROPIC_MODEL: 'DeepSeek-V3.2-Exp',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'DeepSeek-V3.2-Exp',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'DeepSeek-V3.2-Exp',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'DeepSeek-V3.2-Exp',
      },
    },
    category: 'cn_official',
    description: 'DeepSeek AI',
  },
  {
    name: 'Zhipu GLM',
    websiteUrl: 'https://open.bigmodel.cn',
    apiKeyUrl: 'https://www.bigmodel.cn/claude-code',
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: 'https://open.bigmodel.cn/api/anthropic',
        ANTHROPIC_AUTH_TOKEN: '',
        ANTHROPIC_MODEL: 'glm-4.6',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'glm-4.5-air',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'glm-4.6',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'glm-4.6',
      },
    },
    category: 'cn_official',
    description: '智谱 GLM',
  },
  {
    name: 'Qwen Coder',
    websiteUrl: 'https://bailian.console.aliyun.com',
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: 'https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy',
        ANTHROPIC_AUTH_TOKEN: '',
        ANTHROPIC_MODEL: 'qwen3-max',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'qwen3-max',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'qwen3-max',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'qwen3-max',
      },
    },
    category: 'cn_official',
    description: '阿里通义千问',
  },
  {
    name: 'Kimi k2',
    websiteUrl: 'https://platform.moonshot.cn/console',
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: 'https://api.moonshot.cn/anthropic',
        ANTHROPIC_AUTH_TOKEN: '',
        ANTHROPIC_MODEL: 'kimi-k2-thinking',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'kimi-k2-thinking',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'kimi-k2-thinking',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'kimi-k2-thinking',
      },
    },
    category: 'cn_official',
    description: 'Moonshot Kimi',
  },
  {
    name: 'MiniMax',
    websiteUrl: 'https://platform.minimaxi.com',
    apiKeyUrl: 'https://platform.minimaxi.com/user-center/basic-information',
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: 'https://api.minimaxi.com/anthropic',
        ANTHROPIC_AUTH_TOKEN: '',
        API_TIMEOUT_MS: '3000000',
        CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
        ANTHROPIC_MODEL: 'MiniMax-M2',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'MiniMax-M2',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'MiniMax-M2',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'MiniMax-M2',
      },
    },
    category: 'cn_official',
    description: 'MiniMax AI',
  },
  {
    name: 'AiHubMix',
    websiteUrl: 'https://aihubmix.com',
    apiKeyUrl: 'https://aihubmix.com',
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: 'https://aihubmix.com',
        ANTHROPIC_API_KEY: '',
      },
    },
    category: 'aggregator',
    description: 'AI 聚合服务',
  },
  {
    name: 'PackyCode',
    websiteUrl: 'https://www.packyapi.com',
    apiKeyUrl: 'https://www.packyapi.com/register',
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: 'https://www.packyapi.com',
        ANTHROPIC_AUTH_TOKEN: '',
      },
    },
    category: 'third_party',
    description: 'PackyCode API',
  },
]

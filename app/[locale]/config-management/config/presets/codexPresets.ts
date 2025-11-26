/**
 * Codex preset configuration templates
 * Reference: cc-switch project (https://github.com/farion1231/cc-switch)
 */

export interface CodexPreset {
  name: string
  websiteUrl?: string
  apiKeyUrl?: string
  auth: Record<string, any>
  config: string
  category?: 'official' | 'cn_official' | 'third_party' | 'aggregator'
  description?: string
}

function generateThirdPartyAuth(apiKey = ''): Record<string, any> {
  return {
    OPENAI_API_KEY: apiKey,
  }
}

function generateThirdPartyConfig(
  providerName: string,
  baseUrl: string,
  modelName = 'gpt-5-codex',
): string {
  const cleanProviderName = providerName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '') || 'custom'

  return `model_provider = "${cleanProviderName}"
model = "${modelName}"
model_reasoning_effort = "high"
disable_response_storage = true

[model_providers.${cleanProviderName}]
name = "${cleanProviderName}"
base_url = "${baseUrl}"
wire_api = "responses"
requires_openai_auth = true`
}

export const codexPresets: CodexPreset[] = [
  {
    name: 'OpenAI Official',
    websiteUrl: 'https://chatgpt.com/codex',
    auth: {},
    config: '',
    category: 'official',
    description: 'OpenAI 官方 Codex',
  },
  {
    name: 'Azure OpenAI',
    websiteUrl: 'https://learn.microsoft.com/azure/ai-services/openai/how-to/overview',
    auth: generateThirdPartyAuth(''),
    config: `model_provider = "azure"
model = "gpt-5-codex"
model_reasoning_effort = "high"
disable_response_storage = true

[model_providers.azure]
name = "Azure OpenAI"
base_url = "https://YOUR_RESOURCE_NAME.openai.azure.com/openai"
env_key = "OPENAI_API_KEY"
query_params = { "api-version" = "2025-04-01-preview" }
wire_api = "responses"
requires_openai_auth = true`,
    category: 'official',
    description: 'Microsoft Azure OpenAI',
  },
  {
    name: 'AiHubMix',
    websiteUrl: 'https://aihubmix.com',
    auth: generateThirdPartyAuth(''),
    config: generateThirdPartyConfig('aihubmix', 'https://aihubmix.com/v1', 'gpt-5-codex'),
    category: 'aggregator',
    description: 'AI 聚合服务',
  },
  {
    name: 'PackyCode',
    websiteUrl: 'https://www.packyapi.com',
    apiKeyUrl: 'https://www.packyapi.com/register',
    auth: generateThirdPartyAuth(''),
    config: generateThirdPartyConfig('packycode', 'https://www.packyapi.com/v1', 'gpt-5-codex'),
    category: 'third_party',
    description: 'PackyCode API',
  },
]

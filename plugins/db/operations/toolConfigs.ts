import type { ClaudeConfig, CodexConfig, GeminiConfig } from '../schema'
import { getNextId, loadState, mutateState } from '../store'

// Claude configs

export async function getAllClaudeConfigs(): Promise<ClaudeConfig[]> {
  const state = await loadState()
  return [...state.claudeConfigs].sort((a, b) => b.createdAt - a.createdAt)
}

export async function getActiveClaudeConfig(): Promise<ClaudeConfig | undefined> {
  const state = await loadState()
  return state.claudeConfigs.find(config => config.isActive)
}

export async function createClaudeConfig(
  data: Omit<ClaudeConfig, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<number> {
  let newId = 0
  await mutateState((state) => {
    if (data.isActive) {
      state.claudeConfigs.forEach(config => (config.isActive = false))
    }

    newId = getNextId(state, 'claudeConfigs')
    state.claudeConfigs.push({
      ...data,
      id: newId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  })
  return newId
}

export async function updateClaudeConfig(
  id: number,
  updates: Partial<Omit<ClaudeConfig, 'id' | 'createdAt'>>,
): Promise<void> {
  await mutateState((state) => {
    const target = state.claudeConfigs.find(config => config.id === id)
    if (!target)
      return

    if (updates.isActive) {
      state.claudeConfigs.forEach(config => (config.isActive = false))
    }

    Object.assign(target, updates, { updatedAt: Date.now() })
  })
}

export async function deleteClaudeConfig(id: number): Promise<void> {
  await mutateState((state) => {
    state.claudeConfigs = state.claudeConfigs.filter(config => config.id !== id)
  })
}

export async function setActiveClaudeConfig(id: number): Promise<void> {
  await updateClaudeConfig(id, { isActive: true })
}

// Codex configs

export async function getAllCodexConfigs(): Promise<CodexConfig[]> {
  const state = await loadState()
  return [...state.codexConfigs].sort((a, b) => b.createdAt - a.createdAt)
}

export async function getActiveCodexConfig(): Promise<CodexConfig | undefined> {
  const state = await loadState()
  return state.codexConfigs.find(config => config.isActive)
}

export async function createCodexConfig(
  data: Omit<CodexConfig, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<number> {
  let newId = 0
  await mutateState((state) => {
    if (data.isActive)
      state.codexConfigs.forEach(config => (config.isActive = false))

    newId = getNextId(state, 'codexConfigs')
    state.codexConfigs.push({
      ...data,
      id: newId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  })
  return newId
}

export async function updateCodexConfig(
  id: number,
  updates: Partial<Omit<CodexConfig, 'id' | 'createdAt'>>,
): Promise<void> {
  await mutateState((state) => {
    const target = state.codexConfigs.find(config => config.id === id)
    if (!target)
      return

    if (updates.isActive)
      state.codexConfigs.forEach(config => (config.isActive = false))

    Object.assign(target, updates, { updatedAt: Date.now() })
  })
}

export async function deleteCodexConfig(id: number): Promise<void> {
  await mutateState((state) => {
    state.codexConfigs = state.codexConfigs.filter(config => config.id !== id)
  })
}

export async function setActiveCodexConfig(id: number): Promise<void> {
  await updateCodexConfig(id, { isActive: true })
}

// Gemini configs

export async function getAllGeminiConfigs(): Promise<GeminiConfig[]> {
  const state = await loadState()
  return [...state.geminiConfigs].sort((a, b) => b.createdAt - a.createdAt)
}

export async function getActiveGeminiConfig(): Promise<GeminiConfig | undefined> {
  const state = await loadState()
  return state.geminiConfigs.find(config => config.isActive)
}

export async function createGeminiConfig(
  data: Omit<GeminiConfig, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<number> {
  let newId = 0
  await mutateState((state) => {
    if (data.isActive)
      state.geminiConfigs.forEach(config => (config.isActive = false))

    newId = getNextId(state, 'geminiConfigs')
    state.geminiConfigs.push({
      ...data,
      id: newId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  })
  return newId
}

export async function updateGeminiConfig(
  id: number,
  updates: Partial<Omit<GeminiConfig, 'id' | 'createdAt'>>,
): Promise<void> {
  await mutateState((state) => {
    const target = state.geminiConfigs.find(config => config.id === id)
    if (!target)
      return

    if (updates.isActive)
      state.geminiConfigs.forEach(config => (config.isActive = false))

    Object.assign(target, updates, { updatedAt: Date.now() })
  })
}

export async function deleteGeminiConfig(id: number): Promise<void> {
  await mutateState((state) => {
    state.geminiConfigs = state.geminiConfigs.filter(config => config.id !== id)
  })
}

export async function setActiveGeminiConfig(id: number): Promise<void> {
  await updateGeminiConfig(id, { isActive: true })
}

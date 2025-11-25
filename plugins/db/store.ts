'use client'

import { Store } from '@tauri-apps/plugin-store'
import { isTauriEnvironment } from '@/utils/env'
import {
  type ClaudeConfig,
  type CodexConfig,
  createInitialState,
  type DatabaseCounters,
  type DatabaseState,
  type GeminiConfig,
  type Group,
  type ProcessSession,
  type Project,
  type Settings,
  type Tag,
} from './schema'

const STORE_FILE = 'xagents.store'
const STORE_KEY = 'db'
const LOCAL_STORAGE_KEY = 'xagents_db'

let storePromise: Promise<Store | null> | null = null
let cachedState: DatabaseState | null = null

function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

async function getStore(): Promise<Store | null> {
  if (!isTauriEnvironment())
    return null

  if (!storePromise) {
    storePromise = Store.load(STORE_FILE).catch((error) => {
      console.error('[DB] Failed to load Tauri store:', error)
      return null
    })
  }

  return await storePromise
}

function loadFromLocalStorage(): DatabaseState | null {
  if (typeof window === 'undefined')
    return null
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw)
      return JSON.parse(raw) as DatabaseState
  }
  catch (error) {
    console.error('[DB] Failed to parse local storage state:', error)
  }
  return null
}

function saveToLocalStorage(state: DatabaseState) {
  if (typeof window === 'undefined')
    return
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))
  }
  catch (error) {
    console.error('[DB] Failed to persist local storage state:', error)
  }
}

export async function loadState(): Promise<DatabaseState> {
  if (cachedState)
    return cloneState(cachedState)

  const store = await getStore()
  if (store) {
    const stored = await store.get<DatabaseState>(STORE_KEY)
    if (stored) {
      cachedState = stored
    }
    else {
      const migrated = await migrateFromIndexedDB()
      cachedState = migrated ?? createInitialState()
      await store.set(STORE_KEY, cachedState)
      await store.save()
    }
    return cloneState(cachedState)
  }

  const localState = loadFromLocalStorage()
  cachedState = localState ?? createInitialState()
  if (!localState)
    saveToLocalStorage(cachedState)
  return cloneState(cachedState)
}

export async function saveState(state: DatabaseState): Promise<void> {
  cachedState = state
  const store = await getStore()
  if (store) {
    await store.set(STORE_KEY, state)
    await store.save()
  }
  else {
    saveToLocalStorage(state)
  }
}

export async function mutateState<T>(mutator: (draft: DatabaseState) => T): Promise<T> {
  const state = await loadState()
  const result = mutator(state)
  await saveState(state)
  return result
}

export function getNextId(state: DatabaseState, key: keyof DatabaseCounters): number {
  const next = (state.counters[key] ?? 0) + 1
  state.counters[key] = next
  return next
}

export async function resetState(): Promise<void> {
  const initial = createInitialState()
  await saveState(initial)
}

function computeCounter(items: Array<{ id?: number }>): number {
  return items.reduce((max, item) => {
    if (typeof item.id === 'number' && item.id > max)
      return item.id
    return max
  }, 0)
}

async function migrateFromIndexedDB(): Promise<DatabaseState | null> {
  if (typeof indexedDB === 'undefined')
    return null

  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('xagents_db')
      request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
      request.onsuccess = () => resolve(request.result)
    })

    const readStore = <T = unknown>(storeName: string): Promise<T[]> => {
      return new Promise((resolve, reject) => {
        let transaction: IDBTransaction
        try {
          transaction = db.transaction(storeName, 'readonly')
        }
        catch (error) {
          reject(error)
          return
        }
        const store = transaction.objectStore(storeName)
        const request = store.getAll()
        request.onerror = () => reject(request.error ?? new Error(`Failed to read store ${storeName}`))
        request.onsuccess = () => resolve(request.result as T[])
      })
    }

    const [
      projects = [],
      groups = [],
      tags = [],
      sessions = [],
      settings = [],
      claudeConfigs = [],
      codexConfigs = [],
      geminiConfigs = [],
    ] = await Promise.all([
      readStore<Project>('projects'),
      readStore<Group>('groups'),
      readStore<Tag>('tags'),
      readStore<ProcessSession>('sessions'),
      readStore<Settings>('settings'),
      readStore<ClaudeConfig>('claudeConfigs'),
      readStore<CodexConfig>('codexConfigs'),
      readStore<GeminiConfig>('geminiConfigs'),
    ]).catch((error) => {
      console.error('[DB] Failed to read IndexedDB stores:', error)
      return []
    })

    db.close()

    const hasData = [projects, groups, tags, sessions, settings, claudeConfigs, codexConfigs, geminiConfigs]
      .some(collection => collection.length > 0)

    if (!hasData)
      return null

    const counters: DatabaseCounters = {
      projects: computeCounter(projects),
      groups: computeCounter(groups),
      tags: computeCounter(tags),
      sessions: computeCounter(sessions),
      claudeConfigs: computeCounter(claudeConfigs),
      codexConfigs: computeCounter(codexConfigs),
      geminiConfigs: computeCounter(geminiConfigs),
    }

    console.info('[DB] Migrated data from IndexedDB to Tauri Store')

    return {
      projects,
      groups,
      tags,
      sessions,
      settings,
      claudeConfigs,
      codexConfigs,
      geminiConfigs,
      counters,
    }
  }
  catch (error) {
    console.error('[DB] IndexedDB migration failed:', error)
    return null
  }
}

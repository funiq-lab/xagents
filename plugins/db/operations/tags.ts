import type { Tag } from '../schema'
import { getNextId, loadState, mutateState } from '../store'

export async function createTag(name: string, color: string): Promise<number> {
  let newId = 0
  await mutateState((state) => {
    newId = getNextId(state, 'tags')
    state.tags.push({
      id: newId,
      name,
      color,
      createdAt: Date.now(),
    })
  })
  return newId
}

export async function updateTag(
  id: number,
  updates: { name?: string, color?: string },
): Promise<void> {
  await mutateState((state) => {
    const tag = state.tags.find(t => t.id === id)
    if (tag)
      Object.assign(tag, updates)
  })
}

export async function deleteTag(id: number): Promise<void> {
  await mutateState((state) => {
    state.projects.forEach((project) => {
      if (project.tagIds.includes(id)) {
        project.tagIds = project.tagIds.filter(tagId => tagId !== id)
        project.updatedAt = Date.now()
      }
    })
    state.tags = state.tags.filter(tag => tag.id !== id)
  })
}

export async function getTagById(id: number): Promise<Tag | undefined> {
  const state = await loadState()
  return state.tags.find(tag => tag.id === id)
}

export async function getAllTags(): Promise<Tag[]> {
  const state = await loadState()
  return [...state.tags].sort((a, b) => a.createdAt - b.createdAt)
}

export async function getTagByName(name: string): Promise<Tag | undefined> {
  const state = await loadState()
  return state.tags.find(tag => tag.name === name)
}

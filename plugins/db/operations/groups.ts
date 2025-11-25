import type { Group } from '../schema'
import { getNextId, loadState, mutateState } from '../store'

export async function createGroup(name: string, color: string): Promise<number> {
  let newId = 0
  await mutateState((state) => {
    newId = getNextId(state, 'groups')
    state.groups.push({
      id: newId,
      name,
      color,
      createdAt: Date.now(),
    })
  })
  return newId
}

export async function updateGroup(
  id: number,
  updates: { name?: string, color?: string },
): Promise<void> {
  await mutateState((state) => {
    const group = state.groups.find(g => g.id === id)
    if (group)
      Object.assign(group, updates)
  })
}

export async function deleteGroup(id: number): Promise<void> {
  await mutateState((state) => {
    state.projects.forEach((project) => {
      if (project.groupId === id) {
        project.groupId = undefined
        project.updatedAt = Date.now()
      }
    })
    state.groups = state.groups.filter(group => group.id !== id)
  })
}

export async function getGroupById(id: number): Promise<Group | undefined> {
  const state = await loadState()
  return state.groups.find(group => group.id === id)
}

export async function getAllGroups(): Promise<Group[]> {
  const state = await loadState()
  return [...state.groups].sort((a, b) => a.createdAt - b.createdAt)
}

export async function getGroupByName(name: string): Promise<Group | undefined> {
  const state = await loadState()
  return state.groups.find(group => group.name === name)
}

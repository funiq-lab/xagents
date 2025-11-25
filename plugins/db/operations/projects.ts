import type { Project } from '../schema'
import { getNextId, loadState, mutateState } from '../store'

export interface CreateProjectInput {
  name: string
  description?: string
  path: string
  groupId?: number
  tagIds?: number[]
}

export async function createProject(data: CreateProjectInput): Promise<number> {
  let newId = 0
  await mutateState((state) => {
    newId = getNextId(state, 'projects')
    state.projects.push({
      ...data,
      id: newId,
      tagIds: data.tagIds || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  })
  return newId
}

export async function createProjectsBulk(data: CreateProjectInput[]): Promise<void> {
  if (!data.length)
    return

  await mutateState((state) => {
    const now = Date.now()
    for (const project of data) {
      const id = getNextId(state, 'projects')
      state.projects.push({
        ...project,
        id,
        tagIds: project.tagIds || [],
        createdAt: now,
        updatedAt: now,
      })
    }
  })
}

export async function updateProject(
  id: number,
  updates: Partial<Omit<Project, 'id' | 'createdAt'>>,
): Promise<void> {
  await mutateState((state) => {
    const target = state.projects.find(project => project.id === id)
    if (target) {
      Object.assign(target, updates, { updatedAt: Date.now() })
    }
  })
}

export async function deleteProject(id: number): Promise<void> {
  await mutateState((state) => {
    state.projects = state.projects.filter(project => project.id !== id)
  })
}

export async function getProjectById(id: number): Promise<Project | undefined> {
  const state = await loadState()
  return state.projects.find(project => project.id === id)
}

export async function getProjectByPath(path: string): Promise<Project | undefined> {
  const state = await loadState()
  return state.projects.find(project => project.path === path)
}

export async function getAllProjects(): Promise<Project[]> {
  const state = await loadState()
  return state.projects
}

export async function getProjectsByGroup(groupId: number): Promise<Project[]> {
  const state = await loadState()
  return state.projects.filter(project => project.groupId === groupId)
}

export async function getProjectsByTags(tagIds: number[]): Promise<Project[]> {
  const state = await loadState()
  return state.projects.filter(project =>
    tagIds.some(tagId => project.tagIds.includes(tagId)),
  )
}

export async function searchProjects(keyword: string): Promise<Project[]> {
  const state = await loadState()
  const lower = keyword.toLowerCase()
  return state.projects.filter(
    project =>
      project.name.toLowerCase().includes(lower)
      || project.description?.toLowerCase().includes(lower)
      || project.path.toLowerCase().includes(lower),
  )
}

export interface ProjectFilter {
  groupId?: number
  tagIds?: number[]
  keyword?: string
}

export async function filterProjects(filter: ProjectFilter): Promise<Project[]> {
  const state = await loadState()
  let projects = state.projects

  if (filter.groupId !== undefined)
    projects = projects.filter(project => project.groupId === filter.groupId)

  if (filter.tagIds && filter.tagIds.length > 0) {
    projects = projects.filter(project =>
      filter.tagIds!.some(tagId => project.tagIds.includes(tagId)),
    )
  }

  if (filter.keyword) {
    const lower = filter.keyword.toLowerCase()
    projects = projects.filter(
      project =>
        project.name.toLowerCase().includes(lower)
        || project.description?.toLowerCase().includes(lower)
        || project.path.toLowerCase().includes(lower),
    )
  }

  return projects
}

export async function addTagToProject(projectId: number, tagId: number): Promise<void> {
  await mutateState((state) => {
    const project = state.projects.find(p => p.id === projectId)
    if (project && !project.tagIds.includes(tagId)) {
      project.tagIds.push(tagId)
      project.updatedAt = Date.now()
    }
  })
}

export async function removeTagFromProject(projectId: number, tagId: number): Promise<void> {
  await mutateState((state) => {
    const project = state.projects.find(p => p.id === projectId)
    if (project) {
      project.tagIds = project.tagIds.filter(id => id !== tagId)
      project.updatedAt = Date.now()
    }
  })
}

export async function bulkUpdateProjects(
  projectIds: number[],
  updates: Partial<Omit<Project, 'id' | 'createdAt'>>,
): Promise<void> {
  if (!projectIds.length)
    return

  await mutateState((state) => {
    const now = Date.now()
    state.projects.forEach((project) => {
      if (project.id && projectIds.includes(project.id)) {
        Object.assign(project, updates, { updatedAt: now })
      }
    })
  })
}

export async function bulkDeleteProjects(projectIds: number[]): Promise<void> {
  if (!projectIds.length)
    return

  await mutateState((state) => {
    state.projects = state.projects.filter(project => !project.id || !projectIds.includes(project.id))
  })
}

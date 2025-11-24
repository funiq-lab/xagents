import { db, type Project } from '../schema'

export interface CreateProjectInput {
  name: string
  description?: string
  path: string
  groupId?: number
  tagIds?: number[]
}

export async function createProject(data: CreateProjectInput): Promise<number> {
  const now = Date.now()
  const id = await db.projects.add({
    ...data,
    tagIds: data.tagIds || [],
    createdAt: now,
    updatedAt: now,
  })
  if (id === undefined) {
    throw new Error('Failed to create project: ID is undefined')
  }
  return id
}

export async function updateProject(
  id: number,
  updates: Partial<Omit<Project, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.projects.update(id, {
    ...updates,
    updatedAt: Date.now(),
  })
}

export async function deleteProject(id: number): Promise<void> {
  await db.projects.delete(id)
}

export async function getProjectById(id: number): Promise<Project | undefined> {
  return await db.projects.get(id)
}

export async function getProjectByPath(path: string): Promise<Project | undefined> {
  return await db.projects.where('path').equals(path).first()
}

export async function getAllProjects(): Promise<Project[]> {
  return await db.projects.toArray()
}

export async function getProjectsByGroup(groupId: number): Promise<Project[]> {
  return await db.projects.where('groupId').equals(groupId).toArray()
}

export async function getProjectsByTags(tagIds: number[]): Promise<Project[]> {
  const allProjects = await db.projects.toArray()
  return allProjects.filter(p =>
    tagIds.some(tid => p.tagIds.includes(tid)),
  )
}

export async function searchProjects(keyword: string): Promise<Project[]> {
  const lowerKeyword = keyword.toLowerCase()
  return await db.projects
    .filter(
      p =>
        p.name.toLowerCase().includes(lowerKeyword)
        || p.description?.toLowerCase().includes(lowerKeyword)
        || p.path.toLowerCase().includes(lowerKeyword),
    )
    .toArray()
}

export interface ProjectFilter {
  groupId?: number
  tagIds?: number[]
  keyword?: string
}

export async function filterProjects(filter: ProjectFilter): Promise<Project[]> {
  let projects = await db.projects.toArray()

  if (filter.groupId !== undefined) {
    projects = projects.filter(p => p.groupId === filter.groupId)
  }

  if (filter.tagIds && filter.tagIds.length > 0) {
    projects = projects.filter(p =>
      filter.tagIds!.some(tid => p.tagIds.includes(tid)),
    )
  }

  if (filter.keyword) {
    const lowerKeyword = filter.keyword.toLowerCase()
    projects = projects.filter(
      p =>
        p.name.toLowerCase().includes(lowerKeyword)
        || p.description?.toLowerCase().includes(lowerKeyword)
        || p.path.toLowerCase().includes(lowerKeyword),
    )
  }

  return projects
}

export async function addTagToProject(projectId: number, tagId: number): Promise<void> {
  const project = await db.projects.get(projectId)
  if (project && !project.tagIds.includes(tagId)) {
    await db.projects.update(projectId, {
      tagIds: [...project.tagIds, tagId],
      updatedAt: Date.now(),
    })
  }
}

export async function removeTagFromProject(projectId: number, tagId: number): Promise<void> {
  const project = await db.projects.get(projectId)
  if (project) {
    await db.projects.update(projectId, {
      tagIds: project.tagIds.filter(tid => tid !== tagId),
      updatedAt: Date.now(),
    })
  }
}

export async function bulkUpdateProjects(
  projectIds: number[],
  updates: Partial<Omit<Project, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.transaction('rw', db.projects, async () => {
    for (const id of projectIds) {
      await db.projects.update(id, {
        ...updates,
        updatedAt: Date.now(),
      })
    }
  })
}

export async function bulkDeleteProjects(projectIds: number[]): Promise<void> {
  await db.projects.bulkDelete(projectIds)
}

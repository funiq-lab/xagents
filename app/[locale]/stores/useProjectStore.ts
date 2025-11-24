import { create } from 'zustand'
import { createGroup, createProject, type CreateProjectInput, createTag, deleteGroup, deleteProject, deleteTag, filterProjects, getAllGroups, getAllProjects, getAllTags, type Group, type Project, type ProjectFilter, type Tag, updateGroup, updateProject, updateTag } from '../db'

export interface ProjectStore {
  projects: Project[]
  groups: Group[]
  tags: Tag[]
  filteredProjects: Project[]
  filter: ProjectFilter
  isLoading: boolean
  loadProjects: () => Promise<void>
  addProject: (data: CreateProjectInput) => Promise<number>
  modifyProject: (id: number, updates: Partial<Project>) => Promise<void>
  removeProject: (id: number) => Promise<void>
  loadGroups: () => Promise<void>
  addGroup: (name: string, color: string) => Promise<number>
  modifyGroup: (id: number, updates: { name?: string, color?: string }) => Promise<void>
  removeGroup: (id: number) => Promise<void>
  loadTags: () => Promise<void>
  addTag: (name: string, color: string) => Promise<number>
  modifyTag: (id: number, updates: { name?: string, color?: string }) => Promise<void>
  removeTag: (id: number) => Promise<void>
  setFilter: (filter: Partial<ProjectFilter>) => void
  applyFilter: () => Promise<void>
  initialize: () => Promise<void>
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  groups: [],
  tags: [],
  filteredProjects: [],
  filter: {},
  isLoading: false,

  // ============ Project operations ============

  loadProjects: async () => {
    set({ isLoading: true })
    try {
      const projects = await getAllProjects()
      set({ projects })
      await get().applyFilter()
    }
    catch (error) {
      console.error('[ProjectStore] Load projects failed:', error)
    }
    finally {
      set({ isLoading: false })
    }
  },

  addProject: async (data) => {
    const id = await createProject(data)
    await get().loadProjects()
    return id
  },

  modifyProject: async (id, updates) => {
    await updateProject(id, updates)
    await get().loadProjects()
  },

  removeProject: async (id) => {
    await deleteProject(id)
    await get().loadProjects()
  },

  // ============ Group operations ============

  loadGroups: async () => {
    try {
      const groups = await getAllGroups()
      set({ groups })
    }
    catch (error) {
      console.error('[ProjectStore] Load groups failed:', error)
    }
  },

  addGroup: async (name, color) => {
    const id = await createGroup(name, color)
    await get().loadGroups()
    return id
  },

  modifyGroup: async (id, updates) => {
    await updateGroup(id, updates)
    await get().loadGroups()
  },

  removeGroup: async (id) => {
    await deleteGroup(id)
    await get().loadGroups()
    await get().loadProjects() // Reload projects because related groupId changed
  },

  // ============ Tag operations ============

  loadTags: async () => {
    try {
      const tags = await getAllTags()
      set({ tags })
    }
    catch (error) {
      console.error('[ProjectStore] Load tags failed:', error)
    }
  },

  addTag: async (name, color) => {
    const id = await createTag(name, color)
    await get().loadTags()
    return id
  },

  modifyTag: async (id, updates) => {
    await updateTag(id, updates)
    await get().loadTags()
  },

  removeTag: async (id) => {
    await deleteTag(id)
    await get().loadTags()
    await get().loadProjects() // Reload projects because related tagIds changed
  },

  // ============ Filtering ============

  setFilter: (newFilter) => {
    set(state => ({
      filter: { ...state.filter, ...newFilter },
    }))
    get().applyFilter()
  },

  applyFilter: async () => {
    const { filter, projects } = get()

    // No filters applied, return all projects
    if (!filter.groupId && (!filter.tagIds || filter.tagIds.length === 0) && !filter.keyword) {
      set({ filteredProjects: projects })
      return
    }

    try {
      const filtered = await filterProjects(filter)
      set({ filteredProjects: filtered })
    }
    catch (error) {
      console.error('[ProjectStore] Apply filter failed:', error)
      set({ filteredProjects: projects })
    }
  },

  // ============ Initialization ============

  initialize: async () => {
    await Promise.all([get().loadProjects(), get().loadGroups(), get().loadTags()])
  },
}))

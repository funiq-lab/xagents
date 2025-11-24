import { create } from 'zustand'

export interface UIStore {
  // Sidebar state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Currently selected project
  selectedProjectId: number | null
  setSelectedProjectId: (id: number | null) => void

  // Dialog state
  dialogs: {
    createProject: boolean
    editProject: boolean
    deleteProject: boolean
    manageGroups: boolean
    manageTags: boolean
  }
  openDialog: (dialog: keyof UIStore['dialogs']) => void
  closeDialog: (dialog: keyof UIStore['dialogs']) => void

  // Toast notifications
  toasts: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  }>
  addToast: (type: UIStore['toasts'][0]['type'], message: string) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIStore>(set => ({
  // ============ Sidebar ============

  sidebarOpen: true,

  setSidebarOpen: open => set({ sidebarOpen: open }),

  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),

  // ============ Selected project ============

  selectedProjectId: null,

  setSelectedProjectId: id => set({ selectedProjectId: id }),

  // ============ Dialogs ============

  dialogs: {
    createProject: false,
    editProject: false,
    deleteProject: false,
    manageGroups: false,
    manageTags: false,
  },

  openDialog: dialog =>
    set(state => ({
      dialogs: { ...state.dialogs, [dialog]: true },
    })),

  closeDialog: dialog =>
    set(state => ({
      dialogs: { ...state.dialogs, [dialog]: false },
    })),

  // ============ Toasts ============

  toasts: [],

  addToast: (type, message) =>
    set(state => ({
      toasts: [
        ...state.toasts,
        {
          id: Math.random().toString(36).substring(7),
          type,
          message,
        },
      ],
    })),

  removeToast: id =>
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    })),
}))

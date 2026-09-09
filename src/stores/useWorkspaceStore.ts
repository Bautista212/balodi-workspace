import { create } from 'zustand'
import { repository } from '@/repositories'
import type { Board, Moodboard, Workspace } from '@/types'

const CURRENT_KEY = 'balodi:workspace'

interface WorkspaceState {
  ready: boolean
  loading: boolean
  error: string | null
  workspaces: Workspace[]
  currentWorkspaceId: string | null
  boards: Board[]
  moodboards: Moodboard[]

  bootstrap: () => Promise<void>
  selectWorkspace: (id: string) => Promise<void>
  refreshCurrent: () => Promise<void>
  createWorkspace: (name: string, description?: string) => Promise<Workspace>
  renameWorkspace: (id: string, name: string, description?: string) => Promise<void>
  deleteWorkspace: (id: string) => Promise<void>
  createBoard: (name: string) => Promise<Board>
  deleteBoard: (id: string) => Promise<void>
  createMoodboard: (name: string) => Promise<Moodboard>
  deleteMoodboard: (id: string) => Promise<void>
  reload: () => Promise<void>
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  ready: false,
  loading: false,
  error: null,
  workspaces: [],
  currentWorkspaceId: null,
  boards: [],
  moodboards: [],

  bootstrap: async () => {
    if (get().loading) return
    set({ loading: true, error: null })
    try {
      await repository.maintenance.ensureSeed()
      const workspaces = await repository.workspaces.list()
      const stored = localStorage.getItem(CURRENT_KEY)
      const current =
        workspaces.find((workspace) => workspace.id === stored)?.id ?? workspaces[0]?.id ?? null
      set({ workspaces, currentWorkspaceId: current, ready: true })
      if (current) {
        localStorage.setItem(CURRENT_KEY, current)
        await get().refreshCurrent()
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No se pudieron cargar los datos', ready: true })
    } finally {
      set({ loading: false })
    }
  },

  refreshCurrent: async () => {
    const id = get().currentWorkspaceId
    if (!id) {
      set({ boards: [], moodboards: [] })
      return
    }
    // Consultas acotadas al workspace abierto, con limite: nunca traemos todo.
    const [boards, moodboards] = await Promise.all([
      repository.boards.listByWorkspace(id, { limit: 50 }),
      repository.moodboards.listByWorkspace(id, { limit: 50 }),
    ])
    set({ boards, moodboards })
  },

  selectWorkspace: async (id) => {
    localStorage.setItem(CURRENT_KEY, id)
    set({ currentWorkspaceId: id })
    await get().refreshCurrent()
  },

  reload: async () => {
    const workspaces = await repository.workspaces.list()
    const current = workspaces.find((w) => w.id === get().currentWorkspaceId)?.id ?? workspaces[0]?.id ?? null
    set({ workspaces, currentWorkspaceId: current })
    if (current) localStorage.setItem(CURRENT_KEY, current)
    await get().refreshCurrent()
  },

  createWorkspace: async (name, description) => {
    const workspace = await repository.workspaces.create({ name, description })
    set((state) => ({ workspaces: [workspace, ...state.workspaces] }))
    await get().selectWorkspace(workspace.id)
    return workspace
  },

  renameWorkspace: async (id, name, description) => {
    const updated = await repository.workspaces.update(id, { name, description })
    set((state) => ({
      workspaces: state.workspaces.map((workspace) => (workspace.id === id ? updated : workspace)),
    }))
  },

  deleteWorkspace: async (id) => {
    await repository.workspaces.remove(id)
    const workspaces = get().workspaces.filter((workspace) => workspace.id !== id)
    const next = workspaces[0]?.id ?? null
    set({ workspaces, currentWorkspaceId: next })
    if (next) localStorage.setItem(CURRENT_KEY, next)
    else localStorage.removeItem(CURRENT_KEY)
    await get().refreshCurrent()
  },

  createBoard: async (name) => {
    const workspaceId = get().currentWorkspaceId
    if (!workspaceId) throw new Error('Creá primero un espacio de trabajo')
    const board = await repository.boards.create({ workspace_id: workspaceId, name })
    set((state) => ({ boards: [board, ...state.boards] }))
    return board
  },

  deleteBoard: async (id) => {
    await repository.boards.remove(id)
    set((state) => ({ boards: state.boards.filter((board) => board.id !== id) }))
  },

  createMoodboard: async (name) => {
    const workspaceId = get().currentWorkspaceId
    if (!workspaceId) throw new Error('Creá primero un espacio de trabajo')
    const moodboard = await repository.moodboards.create({ workspace_id: workspaceId, name })
    set((state) => ({ moodboards: [moodboard, ...state.moodboards] }))
    return moodboard
  },

  deleteMoodboard: async (id) => {
    await repository.moodboards.remove(id)
    set((state) => ({ moodboards: state.moodboards.filter((moodboard) => moodboard.id !== id) }))
  },
}))

import { create } from 'zustand'
import { repository } from '@/repositories'
import { debounce, uid } from '@/lib/utils'
import type { MoodItem, Moodboard, Viewport } from '@/types'
import type { SaveStatus } from './useBoardStore'

export type Tool = 'select' | 'hand' | 'note' | 'text' | 'rect' | 'ellipse' | 'line'

const MAX_HISTORY = 60

interface MoodState {
  loading: boolean
  error: string | null
  moodboard: Moodboard | null
  items: MoodItem[]
  viewport: Viewport
  selection: string[]
  tool: Tool
  showGrid: boolean
  saveStatus: SaveStatus
  past: MoodItem[][]
  future: MoodItem[][]
  clipboard: MoodItem[]
  interactionSnapshot: MoodItem[] | null

  load: (id: string) => Promise<void>
  leave: () => void
  setTool: (tool: Tool) => void
  toggleGrid: () => void
  setViewport: (viewport: Viewport) => void
  setSelection: (ids: string[]) => void
  addToSelection: (id: string) => void

  addItem: (item: Omit<MoodItem, 'id' | 'z'> & Partial<Pick<MoodItem, 'id' | 'z'>>) => MoodItem
  patchItems: (ids: string[], patch: Partial<MoodItem>, options?: { history?: boolean }) => void
  beginInteraction: () => void
  endInteraction: () => void
  deleteSelection: () => void
  duplicateSelection: () => void
  copySelection: () => void
  paste: () => void
  bringForward: () => void
  sendBackward: () => void
  toggleLock: () => void
  undo: () => void
  redo: () => void
  rename: (name: string) => Promise<void>
}

export const useMoodboardStore = create<MoodState>((set, get) => {
  const persist = async () => {
    const { moodboard, items, viewport } = get()
    if (!moodboard) return
    set({ saveStatus: 'saving' })
    try {
      const version = moodboard.version + 1
      await repository.moodboards.saveSnapshot(moodboard.id, {
        document: { items },
        viewport,
        version,
      })
      set({ moodboard: { ...moodboard, version }, saveStatus: 'saved' })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No se pudo guardar', saveStatus: 'idle' })
    }
  }

  // Un solo snapshot por pausa: nunca se guarda en cada movimiento del mouse.
  const scheduleSave = debounce(() => void persist(), 700)
  const scheduleViewportSave = debounce(() => void persist(), 1500)

  const pushHistory = (previous: MoodItem[]) =>
    set((state) => ({
      past: [...state.past, previous].slice(-MAX_HISTORY),
      future: [],
    }))

  const touch = () => {
    set({ saveStatus: 'saving' })
    scheduleSave()
  }

  const nextZ = () => Math.max(0, ...get().items.map((item) => item.z)) + 1

  return {
    loading: false,
    error: null,
    moodboard: null,
    items: [],
    viewport: { x: 0, y: 0, scale: 1 },
    selection: [],
    tool: 'select',
    showGrid: true,
    saveStatus: 'idle',
    past: [],
    future: [],
    clipboard: [],
    interactionSnapshot: null,

    load: async (id) => {
      set({ loading: true, error: null, items: [], selection: [], past: [], future: [] })
      try {
        const moodboard = await repository.moodboards.get(id)
        if (!moodboard) {
          set({ error: 'No encontramos ese moodboard', loading: false })
          return
        }
        set({
          moodboard,
          items: moodboard.document_data.items ?? [],
          viewport: moodboard.viewport_data ?? { x: 0, y: 0, scale: 1 },
          loading: false,
          saveStatus: 'idle',
        })
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Error al abrir el moodboard', loading: false })
      }
    },

    leave: () => {
      scheduleViewportSave.cancel()
      scheduleSave.flush()
      set({ moodboard: null, items: [], selection: [], past: [], future: [] })
    },

    setTool: (tool) => set({ tool }),
    toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

    setViewport: (viewport) => {
      set({ viewport })
      scheduleViewportSave()
    },

    setSelection: (ids) => set({ selection: ids }),
    addToSelection: (id) =>
      set((state) => ({
        selection: state.selection.includes(id)
          ? state.selection.filter((current) => current !== id)
          : [...state.selection, id],
      })),

    addItem: (input) => {
      const item: MoodItem = { id: input.id ?? uid(), z: input.z ?? nextZ(), ...input } as MoodItem
      pushHistory(get().items)
      set((state) => ({ items: [...state.items, item], selection: [item.id] }))
      touch()
      return item
    },

    patchItems: (ids, patch, options) => {
      if (ids.length === 0) return
      if (options?.history !== false) pushHistory(get().items)
      set((state) => ({
        items: state.items.map((item) => (ids.includes(item.id) ? { ...item, ...patch } : item)),
      }))
      touch()
    },

    beginInteraction: () => set({ interactionSnapshot: get().items }),

    endInteraction: () => {
      const snapshot = get().interactionSnapshot
      set({ interactionSnapshot: null })
      if (!snapshot) return
      if (snapshot === get().items) return
      pushHistory(snapshot)
      touch()
    },

    deleteSelection: () => {
      const { selection, items } = get()
      const removable = items.filter((item) => selection.includes(item.id) && !item.locked)
      if (removable.length === 0) return
      pushHistory(items)
      const ids = removable.map((item) => item.id)
      set({ items: items.filter((item) => !ids.includes(item.id)), selection: [] })
      touch()
    },

    duplicateSelection: () => {
      const { selection, items } = get()
      if (selection.length === 0) return
      pushHistory(items)
      let z = nextZ()
      const copies = items
        .filter((item) => selection.includes(item.id))
        .map((item) => ({ ...item, id: uid(), x: item.x + 24, y: item.y + 24, z: z++ }))
      set({ items: [...items, ...copies], selection: copies.map((item) => item.id) })
      touch()
    },

    copySelection: () => {
      const { selection, items } = get()
      set({ clipboard: items.filter((item) => selection.includes(item.id)) })
    },

    paste: () => {
      const { clipboard, items } = get()
      if (clipboard.length === 0) return
      pushHistory(items)
      let z = nextZ()
      const copies = clipboard.map((item) => ({ ...item, id: uid(), x: item.x + 32, y: item.y + 32, z: z++ }))
      set({ items: [...items, ...copies], selection: copies.map((item) => item.id) })
      touch()
    },

    bringForward: () => {
      const { selection, items } = get()
      if (selection.length === 0) return
      pushHistory(items)
      let z = nextZ()
      set({
        items: items.map((item) => (selection.includes(item.id) ? { ...item, z: z++ } : item)),
      })
      touch()
    },

    sendBackward: () => {
      const { selection, items } = get()
      if (selection.length === 0) return
      pushHistory(items)
      let z = Math.min(0, ...items.map((item) => item.z)) - selection.length
      set({
        items: items.map((item) => (selection.includes(item.id) ? { ...item, z: z++ } : item)),
      })
      touch()
    },

    toggleLock: () => {
      const { selection, items } = get()
      if (selection.length === 0) return
      const shouldLock = items.some((item) => selection.includes(item.id) && !item.locked)
      pushHistory(items)
      set({
        items: items.map((item) =>
          selection.includes(item.id) ? { ...item, locked: shouldLock } : item,
        ),
      })
      touch()
    },

    undo: () => {
      const { past, items, future } = get()
      if (past.length === 0) return
      const previous = past[past.length - 1]
      set({ past: past.slice(0, -1), items: previous, future: [items, ...future], selection: [] })
      touch()
    },

    redo: () => {
      const { future, items, past } = get()
      if (future.length === 0) return
      const [next, ...rest] = future
      set({ future: rest, items: next, past: [...past, items], selection: [] })
      touch()
    },

    rename: async (name) => {
      const moodboard = get().moodboard
      if (!moodboard) return
      await repository.moodboards.rename(moodboard.id, name)
      set({ moodboard: { ...moodboard, name } })
    },
  }
})

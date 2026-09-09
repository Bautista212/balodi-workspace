import { create } from 'zustand'
import { repository } from '@/repositories'
import { debounce, now, positionBetween, uid } from '@/lib/utils'
import type { Board, Column, Task, TaskPriority } from '@/types'

export type SaveStatus = 'idle' | 'saving' | 'saved'

interface BoardState {
  loading: boolean
  error: string | null
  board: Board | null
  columns: Column[]
  tasks: Task[]
  saveStatus: SaveStatus
  dirtyColumns: Set<string>
  dirtyTasks: Set<string>

  load: (boardId: string) => Promise<void>
  leave: () => void
  addColumn: (title?: string) => void
  updateColumn: (id: string, patch: Partial<Pick<Column, 'title' | 'color'>>) => void
  moveColumn: (activeId: string, overId: string) => void
  removeColumn: (id: string) => Promise<void>
  addTask: (columnId: string, title: string) => Task | null
  updateTask: (id: string, patch: Partial<Task>) => void
  duplicateTask: (id: string) => void
  removeTask: (id: string) => Promise<void>
  moveTask: (taskId: string, toColumnId: string, toIndex: number) => void
  renameBoard: (name: string) => Promise<void>
}

const COLUMN_COLORS = ['#fd3a00', '#2f80ed', '#8b7cf6', '#17845a', '#b7791f', '#6b6663']

export const useBoardStore = create<BoardState>((set, get) => {
  const flush = async () => {
    const { board, columns, tasks, dirtyColumns, dirtyTasks } = get()
    if (!board) return
    if (dirtyColumns.size === 0 && dirtyTasks.size === 0) return
    set({ saveStatus: 'saving' })
    const columnBatch = columns.filter((column) => dirtyColumns.has(column.id))
    const taskBatch = tasks.filter((task) => dirtyTasks.has(task.id))
    set({ dirtyColumns: new Set(), dirtyTasks: new Set() })
    try {
      if (columnBatch.length) await repository.boards.saveColumns(board.id, columnBatch)
      if (taskBatch.length) await repository.boards.saveTasks(board.id, taskBatch)
      set({ saveStatus: 'saved' })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No se pudo guardar', saveStatus: 'idle' })
    }
  }

  // Escritura por lotes: la UI se actualiza al instante, IndexedDB despues.
  const scheduleSave = debounce(() => void flush(), 500)

  const markColumns = (ids: string[]) =>
    set((state) => {
      const next = new Set(state.dirtyColumns)
      ids.forEach((id) => next.add(id))
      return { dirtyColumns: next, saveStatus: 'saving' }
    })

  const markTasks = (ids: string[]) =>
    set((state) => {
      const next = new Set(state.dirtyTasks)
      ids.forEach((id) => next.add(id))
      return { dirtyTasks: next, saveStatus: 'saving' }
    })

  return {
    loading: false,
    error: null,
    board: null,
    columns: [],
    tasks: [],
    saveStatus: 'idle',
    dirtyColumns: new Set<string>(),
    dirtyTasks: new Set<string>(),

    load: async (boardId) => {
      set({ loading: true, error: null, board: null, columns: [], tasks: [] })
      try {
        const bundle = await repository.boards.getBundle(boardId)
        if (!bundle) {
          set({ error: 'No encontramos ese tablero', loading: false })
          return
        }
        set({
          board: bundle.board,
          columns: bundle.columns,
          tasks: bundle.tasks,
          loading: false,
          saveStatus: 'idle',
          dirtyColumns: new Set(),
          dirtyTasks: new Set(),
        })
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Error al abrir el tablero', loading: false })
      }
    },

    leave: () => {
      scheduleSave.flush()
      set({ board: null, columns: [], tasks: [], saveStatus: 'idle' })
    },

    addColumn: (title = 'Nueva columna') => {
      const { board, columns } = get()
      if (!board) return
      const ts = now()
      const column: Column = {
        id: uid(),
        board_id: board.id,
        title,
        color: COLUMN_COLORS[columns.length % COLUMN_COLORS.length],
        position: positionBetween(columns[columns.length - 1]?.position),
        created_at: ts,
        updated_at: ts,
      }
      set({ columns: [...columns, column] })
      markColumns([column.id])
      scheduleSave()
    },

    updateColumn: (id, patch) => {
      set((state) => ({
        columns: state.columns.map((column) =>
          column.id === id ? { ...column, ...patch, updated_at: now() } : column,
        ),
      }))
      markColumns([id])
      scheduleSave()
    },

    moveColumn: (activeId, overId) => {
      const columns = [...get().columns]
      const from = columns.findIndex((column) => column.id === activeId)
      const to = columns.findIndex((column) => column.id === overId)
      if (from === -1 || to === -1 || from === to) return
      const [moved] = columns.splice(from, 1)
      columns.splice(to, 0, moved)
      const reordered = columns.map((column, index) => ({
        ...column,
        position: (index + 1) * 1000,
        updated_at: now(),
      }))
      set({ columns: reordered })
      markColumns(reordered.map((column) => column.id))
      scheduleSave()
    },

    removeColumn: async (id) => {
      const { board } = get()
      if (!board) return
      set((state) => ({
        columns: state.columns.filter((column) => column.id !== id),
        tasks: state.tasks.filter((task) => task.column_id !== id),
      }))
      await repository.boards.deleteColumn(board.id, id)
    },

    addTask: (columnId, title) => {
      const { board, tasks } = get()
      if (!board) return null
      const inColumn = tasks.filter((task) => task.column_id === columnId)
      const ts = now()
      const task: Task = {
        id: uid(),
        board_id: board.id,
        column_id: columnId,
        title,
        description: '',
        position: positionBetween(inColumn[inColumn.length - 1]?.position),
        priority: 'medium',
        due_date: null,
        cover_url: null,
        created_at: ts,
        updated_at: ts,
        labels: [],
      }
      set({ tasks: [...tasks, task] })
      markTasks([task.id])
      scheduleSave()
      return task
    },

    updateTask: (id, patch) => {
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...patch, updated_at: now() } : task)),
      }))
      markTasks([id])
      scheduleSave()
    },

    duplicateTask: (id) => {
      const source = get().tasks.find((task) => task.id === id)
      if (!source) return
      const ts = now()
      const copyId = uid()
      const copy: Task = {
        ...source,
        id: copyId,
        title: `${source.title} (copia)`,
        position: source.position + 1,
        created_at: ts,
        updated_at: ts,
        labels: source.labels.map((label) => ({ ...label, id: uid(), task_id: copyId })),
      }
      set((state) => ({ tasks: [...state.tasks, copy] }))
      markTasks([copy.id])
      scheduleSave()
    },

    removeTask: async (id) => {
      set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }))
      await repository.boards.deleteTask(id)
    },

    moveTask: (taskId, toColumnId, toIndex) => {
      const state = get()
      const task = state.tasks.find((item) => item.id === taskId)
      if (!task) return
      const target = state.tasks
        .filter((item) => item.column_id === toColumnId && item.id !== taskId)
        .sort((a, b) => a.position - b.position)
      const index = Math.max(0, Math.min(toIndex, target.length))
      const position = positionBetween(target[index - 1]?.position, target[index]?.position)
      if (task.column_id === toColumnId && task.position === position) return
      set({
        tasks: state.tasks.map((item) =>
          item.id === taskId
            ? { ...item, column_id: toColumnId, position, updated_at: now() }
            : item,
        ),
      })
      markTasks([taskId])
      scheduleSave()
    },

    renameBoard: async (name) => {
      const board = get().board
      if (!board) return
      const updated = await repository.boards.update(board.id, { name })
      set({ board: updated })
    },
  }
})

export function tasksOfColumn(tasks: Task[], columnId: string): Task[] {
  return tasks.filter((task) => task.column_id === columnId).sort((a, b) => a.position - b.position)
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

export const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: '#6b6663',
  medium: '#2f80ed',
  high: '#b7791f',
  urgent: '#c02626',
}

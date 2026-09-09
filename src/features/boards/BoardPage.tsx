import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { ArrowLeft, Check, Loader2, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Field'
import { EmptyState, Skeleton } from '@/components/ui/Misc'
import { PRIORITY_LABEL, tasksOfColumn, useBoardStore } from '@/stores/useBoardStore'
import { toast } from '@/stores/useUiStore'
import { cn } from '@/lib/utils'
import type { TaskPriority } from '@/types'
import { BoardColumn } from './BoardColumn'
import { TaskCardView } from './TaskCard'
import { TaskModal } from './TaskModal'

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const {
    board,
    columns,
    tasks,
    loading,
    error,
    saveStatus,
    load,
    leave,
    addColumn,
    updateColumn,
    moveColumn,
    removeColumn,
    addTask,
    moveTask,
    removeTask,
  } = useBoardStore()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  const [labelFilter, setLabelFilter] = useState<string>('all')
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => {
    if (boardId) void load(boardId)
    return () => leave()
  }, [boardId, load, leave])

  const allLabels = useMemo(
    () => Array.from(new Set(tasks.flatMap((task) => task.labels.map((label) => label.label)))),
    [tasks],
  )

  const visibleTasks = useMemo(() => {
    const term = query.trim().toLowerCase()
    return tasks.filter((task) => {
      if (term && !`${task.title} ${task.description}`.toLowerCase().includes(term)) return false
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
      if (labelFilter !== 'all' && !task.labels.some((label) => label.label === labelFilter)) return false
      return true
    })
  }, [tasks, query, priorityFilter, labelFilter])

  const activeTask = tasks.find((task) => task.id === activeId) ?? null
  const activeColumn = columns.find((column) => column.id === activeId) ?? null
  const openTask = tasks.find((task) => task.id === openTaskId) ?? null

  const onDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id))

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || active.data.current?.type !== 'task') return
    const activeTaskId = String(active.id)
    const overType = over.data.current?.type

    if (overType === 'column') {
      moveTask(activeTaskId, String(over.id), Number.MAX_SAFE_INTEGER)
      return
    }
    if (overType === 'task') {
      const overTask = tasks.find((task) => task.id === over.id)
      if (!overTask) return
      const list = tasksOfColumn(tasks, overTask.column_id).filter((task) => task.id !== activeTaskId)
      let index = list.findIndex((task) => task.id === overTask.id)
      if (index === -1) index = list.length
      const translated = active.rect.current.translated
      if (translated && translated.top > over.rect.top + over.rect.height / 2) index += 1
      moveTask(activeTaskId, overTask.column_id, index)
    }
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    if (active.data.current?.type === 'column' && over.data.current?.type === 'column') {
      moveColumn(String(active.id), String(over.id))
    }
  }

  if (loading) {
    return (
      <div className="px-5 py-8">
        <Skeleton className="h-9 w-64" />
        <div className="mt-6 flex gap-4">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-72 w-[286px]" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="px-5 py-16">
        <EmptyState
          title="No encontramos ese tablero"
          description={error ?? 'Puede que lo hayas eliminado o que el enlace esté mal.'}
          action={
            <Link to="/app/boards">
              <Button>Volver a tableros</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const filtersActive = query.trim() !== '' || priorityFilter !== 'all' || labelFilter !== 'all'

  return (
    <div className="flex h-[calc(100vh-49px)] flex-col md:h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/app/boards" aria-label="Volver a tableros" className="rounded-md p-1.5 hover:bg-[var(--surface-muted)]">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="truncate text-xl">{board.name}</h1>
          <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)]">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Guardando…
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check size={12} /> Guardado
              </>
            ) : null}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar tareas"
                aria-label="Buscar tareas"
                className="h-9 w-44 pl-8"
              />
            </div>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as TaskPriority | 'all')}
              aria-label="Filtrar por prioridad"
              className="h-9 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] px-2 text-[13px]"
            >
              <option value="all">Prioridad: todas</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABEL[priority]}
                </option>
              ))}
            </select>
            {allLabels.length > 0 && (
              <select
                value={labelFilter}
                onChange={(event) => setLabelFilter(event.target.value)}
                aria-label="Filtrar por etiqueta"
                className="h-9 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] px-2 text-[13px]"
              >
                <option value="all">Etiqueta: todas</option>
                {allLabels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            )}
            <Button size="sm" variant="outline" icon={<Plus size={15} />} onClick={() => addColumn()}>
              Columna
            </Button>
          </div>
        </div>
        {filtersActive && (
          <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
            Mostrando {visibleTasks.length} de {tasks.length} tareas.{' '}
            <button
              type="button"
              className="font-semibold text-[var(--balodi-orange)]"
              onClick={() => {
                setQuery('')
                setPriorityFilter('all')
                setLabelFilter('all')
              }}
            >
              Limpiar filtros
            </button>
          </p>
        )}
      </header>

      {columns.length === 0 ? (
        <div className="px-5 py-14">
          <EmptyState
            title="Este tablero está vacío"
            description="Agregá la primera columna: Ideas, Por hacer, En proceso, En revisión, Listo."
            action={<Button onClick={() => addColumn('Ideas')}>Agregar columna</Button>}
          />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className={cn('flex-1 overflow-x-auto overflow-y-hidden px-4 py-4 scrollbar-slim')}>
            <div className="flex h-full min-h-[420px] items-stretch gap-3">
              <SortableContext items={columns.map((column) => column.id)} strategy={horizontalListSortingStrategy}>
                {columns.map((column) => (
                  <BoardColumn
                    key={column.id}
                    column={column}
                    tasks={tasksOfColumn(visibleTasks, column.id)}
                    totalCount={tasksOfColumn(tasks, column.id).length}
                    onRename={(title) => updateColumn(column.id, { title })}
                    onColor={(color) => updateColumn(column.id, { color })}
                    onDelete={() => setColumnToDelete(column.id)}
                    onAddTask={(title) => addTask(column.id, title)}
                    onOpenTask={setOpenTaskId}
                  />
                ))}
              </SortableContext>
              <button
                type="button"
                onClick={() => addColumn()}
                className="flex h-11 w-[240px] shrink-0 items-center justify-center gap-2 rounded-[14px] border border-dashed border-[var(--border-strong)] text-[13px] font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
              >
                <Plus size={15} /> Agregar columna
              </button>
            </div>
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="w-[262px]">
                <TaskCardView task={activeTask} dragging />
              </div>
            ) : activeColumn ? (
              <div className="w-[286px] rounded-[14px] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-[13px] font-bold shadow-[var(--shadow-pop)]">
                {activeColumn.title}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <TaskModal task={openTask} onClose={() => setOpenTaskId(null)} onRequestDelete={setTaskToDelete} />

      <ConfirmDialog
        open={Boolean(columnToDelete)}
        title="Eliminar columna"
        message="Se eliminan también las tareas que están adentro. No se puede deshacer."
        onCancel={() => setColumnToDelete(null)}
        onConfirm={() => {
          const id = columnToDelete
          setColumnToDelete(null)
          if (id) void removeColumn(id).then(() => toast({ title: 'Columna eliminada', tone: 'success' }))
        }}
      />

      <ConfirmDialog
        open={Boolean(taskToDelete)}
        title="Eliminar tarea"
        message="La tarea se borra de este tablero. No se puede deshacer."
        onCancel={() => setTaskToDelete(null)}
        onConfirm={() => {
          const id = taskToDelete
          setTaskToDelete(null)
          setOpenTaskId(null)
          if (id) void removeTask(id).then(() => toast({ title: 'Tarea eliminada', tone: 'success' }))
        }}
      />
    </div>
  )
}

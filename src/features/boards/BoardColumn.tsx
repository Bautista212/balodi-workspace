import { useState } from 'react'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { cn } from '@/lib/utils'
import type { Column, Task } from '@/types'
import { SortableTask } from './TaskCard'

const PALETTE = ['#fd3a00', '#2f80ed', '#8b7cf6', '#17845a', '#b7791f', '#6b6663']

interface BoardColumnProps {
  column: Column
  tasks: Task[]
  totalCount: number
  onRename: (title: string) => void
  onColor: (color: string) => void
  onDelete: () => void
  onAddTask: (title: string) => void
  onOpenTask: (id: string) => void
}

export function BoardColumn({
  column,
  tasks,
  totalCount,
  onRename,
  onColor,
  onDelete,
  onAddTask,
  onOpenTask,
}: BoardColumnProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column' },
  })
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [paletteOpen, setPaletteOpen] = useState(false)

  const submit = () => {
    const value = draft.trim()
    if (value) onAddTask(value)
    setDraft('')
    setAdding(false)
  }

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'flex h-full w-[286px] shrink-0 flex-col rounded-[14px] border border-[var(--border)] bg-[var(--surface-muted)]',
        isDragging && 'opacity-50',
      )}
      aria-label={column.title}
    >
      <header className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          className="cursor-grab rounded p-0.5 text-[var(--text-secondary)] active:cursor-grabbing"
          aria-label={`Mover columna ${column.title}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={15} />
        </button>
        <button
          type="button"
          aria-label="Cambiar color"
          onClick={() => setPaletteOpen((open) => !open)}
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ background: column.color }}
        />
        <input
          value={column.title}
          onChange={(event) => onRename(event.target.value)}
          aria-label="Nombre de la columna"
          className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-[13px] font-bold focus:bg-[var(--surface)] focus:outline-none"
        />
        <span className="shrink-0 rounded-full bg-[var(--surface-sunken)] px-2 py-0.5 text-[11px] font-bold text-[var(--text-secondary)]">
          {totalCount}
        </span>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Eliminar columna ${column.title}`}
          className="rounded p-1 text-[var(--text-secondary)] transition-colors hover:text-[var(--danger)]"
        >
          <Trash2 size={14} />
        </button>
      </header>

      {paletteOpen && (
        <div className="mx-3 mb-2 flex gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-2">
          {PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Color ${color}`}
              onClick={() => {
                onColor(color)
                setPaletteOpen(false)
              }}
              className="h-5 w-5 rounded-full border border-black/10"
              style={{ background: color }}
            />
          ))}
        </div>
      )}

      <div className="flex min-h-[60px] flex-1 flex-col gap-2 overflow-y-auto px-3 pb-2 scrollbar-slim">
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTask key={task.id} task={task} onOpen={onOpenTask} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="rounded-[10px] border border-dashed border-[var(--border-strong)] px-3 py-6 text-center text-[12px] text-[var(--text-secondary)]">
            Soltá tarjetas acá
          </p>
        )}
      </div>

      <footer className="px-3 pb-3">
        {adding ? (
          <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-2">
            <Input
              autoFocus
              value={draft}
              placeholder="Título de la tarea"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submit()
                if (event.key === 'Escape') {
                  setDraft('')
                  setAdding(false)
                }
              }}
            />
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={submit}>
                Agregar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-2 rounded-[10px] px-2 py-2 text-[13px] font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]"
          >
            <Plus size={15} /> Agregar tarea
          </button>
        )}
      </footer>
    </section>
  )
}

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarDays, Flag } from 'lucide-react'
import { PRIORITY_COLOR, PRIORITY_LABEL } from '@/stores/useBoardStore'
import { cn, formatDate, relativeDay } from '@/lib/utils'
import type { Task } from '@/types'

export function TaskCardView({ task, dragging }: { task: Task; dragging?: boolean }) {
  const due = relativeDay(task.due_date)
  return (
    <article
      className={cn(
        'rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3 text-left shadow-[var(--shadow-card)]',
        dragging && 'rotate-2 shadow-[var(--shadow-pop)]',
      )}
    >
      {task.cover_url && (
        <img
          src={task.cover_url}
          alt=""
          className="mb-2.5 h-24 w-full rounded-[8px] object-cover"
          loading="lazy"
        />
      )}
      {task.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
              style={{ background: label.color }}
            >
              {label.label}
            </span>
          ))}
        </div>
      )}
      <p className="text-[14px] font-semibold leading-snug">{task.title}</p>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-[12px] text-[var(--text-secondary)]">{task.description}</p>
      )}
      <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[11px] text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-1 font-semibold" style={{ color: PRIORITY_COLOR[task.priority] }}>
          <Flag size={11} /> {PRIORITY_LABEL[task.priority]}
        </span>
        {task.due_date && (
          <span
            className={cn(
              'inline-flex items-center gap-1',
              due === 'overdue' && 'font-semibold text-[var(--danger)]',
              due === 'today' && 'font-semibold text-[var(--warning)]',
            )}
          >
            <CalendarDays size={11} /> {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </article>
  )
}

export function SortableTask({ task, onOpen }: { task: Task; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', columnId: task.column_id },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('touch-manipulation', isDragging && 'opacity-40')}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab rounded-[12px] active:cursor-grabbing"
        onClick={() => onOpen(task.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onOpen(task.id)
          }
        }}
      >
        <TaskCardView task={task} />
      </div>
    </div>
  )
}

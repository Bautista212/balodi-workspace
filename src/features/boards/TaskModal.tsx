import { useState } from 'react'
import { Copy, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Label, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PRIORITY_LABEL, useBoardStore } from '@/stores/useBoardStore'
import { uid } from '@/lib/utils'
import type { Task, TaskPriority } from '@/types'

const LABEL_COLORS = ['#fd3a00', '#2f80ed', '#8b7cf6', '#17845a', '#b7791f']
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

export function TaskModal({
  task,
  onClose,
  onRequestDelete,
}: {
  task: Task | null
  onClose: () => void
  onRequestDelete: (id: string) => void
}) {
  const { updateTask, duplicateTask } = useBoardStore()
  const [labelDraft, setLabelDraft] = useState('')

  if (!task) return null

  const addLabel = () => {
    const value = labelDraft.trim()
    if (!value) return
    updateTask(task.id, {
      labels: [
        ...task.labels,
        {
          id: uid(),
          task_id: task.id,
          label: value,
          color: LABEL_COLORS[task.labels.length % LABEL_COLORS.length],
        },
      ],
    })
    setLabelDraft('')
  }

  return (
    <Modal
      open
      size="md"
      title="Detalle de la tarea"
      onClose={onClose}
      footer={
        <>
          <Button
            variant="ghost"
            icon={<Copy size={15} />}
            onClick={() => {
              duplicateTask(task.id)
              onClose()
            }}
          >
            Duplicar
          </Button>
          <Button
            variant="ghost"
            className="text-[var(--danger)]"
            icon={<Trash2 size={15} />}
            onClick={() => onRequestDelete(task.id)}
          >
            Eliminar
          </Button>
          <Button onClick={onClose}>Listo</Button>
        </>
      }
    >
      <Label htmlFor="task-title">Título</Label>
      <Input
        id="task-title"
        data-autofocus
        value={task.title}
        onChange={(event) => updateTask(task.id, { title: event.target.value })}
      />

      <div className="mt-4">
        <Label htmlFor="task-description">Descripción</Label>
        <Textarea
          id="task-description"
          value={task.description}
          placeholder="Qué hay que hacer, con qué detalle."
          onChange={(event) => updateTask(task.id, { description: event.target.value })}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Prioridad</Label>
          <div className="flex flex-wrap gap-1.5">
            {PRIORITIES.map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => updateTask(task.id, { priority })}
                aria-pressed={task.priority === priority}
                className={
                  task.priority === priority
                    ? 'rounded-full bg-[var(--balodi-black)] px-3 py-1.5 text-[12px] font-semibold text-white'
                    : 'rounded-full border border-[var(--border-strong)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
                }
              >
                {PRIORITY_LABEL[priority]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="task-due">Fecha límite</Label>
          <Input
            id="task-due"
            type="date"
            value={task.due_date ?? ''}
            onChange={(event) => updateTask(task.id, { due_date: event.target.value || null })}
          />
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="task-label">Etiquetas</Label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
              style={{ background: label.color }}
            >
              {label.label}
              <button
                type="button"
                aria-label={`Quitar ${label.label}`}
                onClick={() =>
                  updateTask(task.id, { labels: task.labels.filter((item) => item.id !== label.id) })
                }
              >
                <X size={11} />
              </button>
            </span>
          ))}
          {task.labels.length === 0 && (
            <span className="text-[12px] text-[var(--text-secondary)]">Sin etiquetas todavía.</span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            id="task-label"
            value={labelDraft}
            placeholder="Contenido, Pauta, Diseño…"
            onChange={(event) => setLabelDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addLabel()
              }
            }}
          />
          <Button variant="outline" onClick={addLabel}>
            Agregar
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="task-cover">Portada (URL de imagen)</Label>
        <Input
          id="task-cover"
          value={task.cover_url ?? ''}
          placeholder="https://…"
          onChange={(event) => updateTask(task.id, { cover_url: event.target.value || null })}
        />
      </div>
    </Modal>
  )
}

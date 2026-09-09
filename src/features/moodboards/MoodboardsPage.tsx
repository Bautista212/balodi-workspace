import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layers, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PromptDialog } from '@/components/ui/PromptDialog'
import { EmptyState } from '@/components/ui/Misc'
import { toast } from '@/stores/useUiStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { formatDate } from '@/lib/utils'

export function MoodboardsPage() {
  const { moodboards, createMoodboard, deleteMoodboard, currentWorkspaceId } = useWorkspaceStore()
  const [creating, setCreating] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const navigate = useNavigate()
  const target = moodboards.find((moodboard) => moodboard.id === pendingDelete)

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Moodboards</h1>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            Una pizarra infinita por proyecto: referencias, notas y enlaces juntos.
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setCreating(true)} disabled={!currentWorkspaceId}>
          Nuevo moodboard
        </Button>
      </div>

      {moodboards.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Layers size={28} />}
            title="Todavía no creaste ningún moodboard"
            description="Empezá uno para juntar referencias visuales, ideas sueltas y links antes de decidir."
            action={
              <Button onClick={() => setCreating(true)} disabled={!currentWorkspaceId}>
                Crear el primero
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {moodboards.map((moodboard) => (
            <li
              key={moodboard.id}
              className="group relative overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)]"
            >
              <Link to={`/app/moodboards/${moodboard.id}`} className="block">
                <div
                  className="h-28 border-b border-[var(--border)] bg-[var(--surface-muted)]"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 1px 1px, var(--border-strong) 1px, transparent 0)',
                    backgroundSize: '14px 14px',
                  }}
                />
                <div className="p-4">
                  <p className="truncate font-bold">{moodboard.name}</p>
                  <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                    {moodboard.document_data.items.length} elementos · {formatDate(moodboard.updated_at)}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                aria-label={`Eliminar ${moodboard.name}`}
                onClick={() => setPendingDelete(moodboard.id)}
                className="absolute right-2 top-2 rounded-md bg-white/90 p-1.5 text-[var(--text-secondary)] opacity-0 transition-opacity hover:text-[var(--danger)] focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <PromptDialog
        open={creating}
        title="Nuevo moodboard"
        label="Nombre del moodboard"
        placeholder="Identidad de marca"
        onClose={() => setCreating(false)}
        onSubmit={(name) => {
          void createMoodboard(name).then((moodboard) => {
            setCreating(false)
            navigate(`/app/moodboards/${moodboard.id}`)
          })
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Eliminar "${target?.name ?? ''}"`}
        message="Se borra el moodboard y las imágenes que subiste en él. No se puede deshacer."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return
          const id = pendingDelete
          setPendingDelete(null)
          void deleteMoodboard(id).then(() => toast({ title: 'Moodboard eliminado', tone: 'success' }))
        }}
      />
    </div>
  )
}

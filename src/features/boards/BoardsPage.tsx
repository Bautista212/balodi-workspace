import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, SquareKanban, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PromptDialog } from '@/components/ui/PromptDialog'
import { EmptyState } from '@/components/ui/Misc'
import { BalodiPromo } from '@/features/brand/BalodiPromo'
import { toast } from '@/stores/useUiStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { formatDate } from '@/lib/utils'

const MARKETING_HINT = /market|campa|contenido|redes|publicidad|marca|lanzam/i

export function BoardsPage() {
  const { boards, createBoard, deleteBoard, currentWorkspaceId } = useWorkspaceStore()
  const [creating, setCreating] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const navigate = useNavigate()
  const target = boards.find((board) => board.id === pendingDelete)

  // Mensaje contextual: aparece solo si el equipo trabaja temas de marketing.
  const showMarketingCta = boards.some((board) => MARKETING_HINT.test(board.name))

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Tableros</h1>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            Columnas, tareas y prioridades para que el proyecto avance.
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setCreating(true)} disabled={!currentWorkspaceId}>
          Nuevo tablero
        </Button>
      </div>

      {boards.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<SquareKanban size={28} />}
            title="Todavía no hay tableros"
            description="Creá uno y arrancá con las columnas Ideas, Por hacer, En proceso, En revisión y Listo."
            action={
              <Button onClick={() => setCreating(true)} disabled={!currentWorkspaceId}>
                Crear el primero
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <li
              key={board.id}
              className="group relative rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <Link to={`/app/boards/${board.id}`} className="block">
                <SquareKanban size={20} className="text-[var(--balodi-orange)]" />
                <p className="mt-3 truncate font-bold">{board.name}</p>
                <p className="mt-1 line-clamp-2 text-[13px] text-[var(--text-secondary)]">
                  {board.description || 'Sin descripción'}
                </p>
                <p className="mt-3 text-[12px] text-[var(--text-secondary)]">
                  Actualizado {formatDate(board.updated_at)}
                </p>
              </Link>
              <button
                type="button"
                aria-label={`Eliminar ${board.name}`}
                onClick={() => setPendingDelete(board.id)}
                className="absolute right-2 top-2 rounded-md p-1.5 text-[var(--text-secondary)] opacity-0 transition-opacity hover:text-[var(--danger)] focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {showMarketingCta && <BalodiPromo variant="contextual" className="mt-9" />}

      <PromptDialog
        open={creating}
        title="Nuevo tablero"
        label="Nombre del tablero"
        placeholder="Lanzamiento de campaña"
        onClose={() => setCreating(false)}
        onSubmit={(name) => {
          void createBoard(name).then((board) => {
            setCreating(false)
            navigate(`/app/boards/${board.id}`)
          })
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Eliminar "${target?.name ?? ''}"`}
        message="Se borran sus columnas y tareas. No se puede deshacer."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return
          const id = pendingDelete
          setPendingDelete(null)
          void deleteBoard(id).then(() => toast({ title: 'Tablero eliminado', tone: 'success' }))
        }}
      />
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Download,
  Layers,
  Pencil,
  Plus,
  RotateCcw,
  SquareKanban,
  Trash2,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PromptDialog } from '@/components/ui/PromptDialog'
import { Badge, EmptyState } from '@/components/ui/Misc'
import { BalodiPromo } from '@/features/brand/BalodiPromo'
import { useBackup } from '@/hooks/useBackup'
import { isLocalMode } from '@/config/env'
import { toast } from '@/stores/useUiStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'

type DialogKind = 'workspace' | 'workspace-edit' | 'board' | 'moodboard' | null

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return 'Buenas noches'
  if (hour < 13) return 'Buen día'
  if (hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export function DashboardPage() {
  const {
    workspaces,
    currentWorkspaceId,
    boards,
    moodboards,
    createWorkspace,
    renameWorkspace,
    deleteWorkspace,
    createBoard,
    createMoodboard,
  } = useWorkspaceStore()
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<DialogKind>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { busy: backupBusy, inputRef: backupInputRef, exportBackup, importBackup, resetDemo } = useBackup()

  const current = workspaces.find((workspace) => workspace.id === currentWorkspaceId)

  const recent = useMemo(() => {
    const entries = [
      ...moodboards.map((moodboard) => ({
        id: moodboard.id,
        name: moodboard.name,
        updated: moodboard.updated_at,
        to: `/app/moodboards/${moodboard.id}`,
        kind: 'Moodboard' as const,
      })),
      ...boards.map((board) => ({
        id: board.id,
        name: board.name,
        updated: board.updated_at,
        to: `/app/boards/${board.id}`,
        kind: 'Tablero' as const,
      })),
    ]
    return entries.sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 6)
  }, [boards, moodboards])

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.9rem,4vw,2.6rem)]">{greeting()}.</h1>
          <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
            {current ? (
              <>
                Estás en <strong className="text-[var(--text-primary)]">{current.name}</strong>. Empezá por una idea o
                por una tarea.
              </>
            ) : (
              'Creá tu primer espacio de trabajo para empezar.'
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isLocalMode && <Badge>Modo local</Badge>}
          <Button variant="outline" size="sm" icon={<Plus size={15} />} onClick={() => setDialog('workspace')}>
            Nuevo espacio
          </Button>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <section className="flex flex-col justify-between rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6">
          <div>
            <Layers size={24} className="text-[var(--balodi-orange)]" />
            <h2 className="mt-3 text-2xl">Moodboards</h2>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
              Pizarra infinita para imágenes, notas, enlaces y videos.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setDialog('moodboard')} disabled={!current}>
              Crear moodboard
            </Button>
            <Link to="/app/moodboards">
              <Button size="sm" variant="outline">
                Ver todos ({moodboards.length})
              </Button>
            </Link>
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6">
          <div>
            <SquareKanban size={24} className="text-[var(--balodi-orange)]" />
            <h2 className="mt-3 text-2xl">Tableros</h2>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
              Tareas, etapas y prioridades en columnas que podés mover.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setDialog('board')} disabled={!current}>
              Crear tablero
            </Button>
            <Link to="/app/boards">
              <Button size="sm" variant="outline">
                Ver todos ({boards.length})
              </Button>
            </Link>
          </div>
        </section>
      </div>

      <section className="mt-9">
        <h2 className="text-lg">Proyectos recientes</h2>
        {recent.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="Todavía no hay nada acá"
              description="Creá un moodboard para juntar referencias o un tablero para ordenar las tareas."
              action={
                <Button onClick={() => setDialog('moodboard')} disabled={!current}>
                  Crear moodboard
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {recent.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.to}
                  className="group flex items-center justify-between gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:border-[var(--border-strong)]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{item.name}</span>
                    <span className="block text-[12px] text-[var(--text-secondary)]">{item.kind}</span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-[var(--text-secondary)] transition-colors group-hover:text-[var(--balodi-orange)]"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BalodiPromo className="mt-9" />

      <section className="mt-9 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-lg">Este espacio</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Tus datos viven en este navegador. Llevátelos a otra máquina con un backup JSON.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Pencil size={15} />}
            onClick={() => setDialog('workspace-edit')}
            disabled={!current}
          >
            Editar espacio
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<Download size={15} />}
            loading={backupBusy}
            onClick={() => void exportBackup()}
          >
            Exportar backup
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<Upload size={15} />}
            onClick={() => backupInputRef.current?.click()}
          >
            Importar backup
          </Button>
          <Button size="sm" variant="outline" icon={<RotateCcw size={15} />} onClick={() => setConfirmReset(true)}>
            Restablecer demo
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-[var(--danger)]"
            icon={<Trash2 size={15} />}
            onClick={() => setConfirmDelete(true)}
            disabled={!current}
          >
            Eliminar espacio
          </Button>
          <input
            ref={backupInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void importBackup(file)
              event.target.value = ''
            }}
          />
        </div>
      </section>

      <PromptDialog
        open={dialog === 'workspace'}
        title="Nuevo espacio de trabajo"
        label="Nombre del espacio"
        placeholder="Mi negocio"
        withDescription
        onClose={() => setDialog(null)}
        onSubmit={(name, description) => {
          void createWorkspace(name, description).then(() => {
            toast({ title: 'Espacio creado', tone: 'success' })
            setDialog(null)
          })
        }}
      />

      <PromptDialog
        open={dialog === 'workspace-edit'}
        title="Editar espacio"
        label="Nombre del espacio"
        initialValue={current?.name ?? ''}
        initialDescription={current?.description ?? ''}
        withDescription
        confirmLabel="Guardar"
        onClose={() => setDialog(null)}
        onSubmit={(name, description) => {
          if (!current) return
          void renameWorkspace(current.id, name, description).then(() => {
            toast({ title: 'Espacio actualizado', tone: 'success' })
            setDialog(null)
          })
        }}
      />

      <PromptDialog
        open={dialog === 'moodboard'}
        title="Nuevo moodboard"
        label="Nombre del moodboard"
        placeholder="Identidad de marca"
        onClose={() => setDialog(null)}
        onSubmit={(name) => {
          void createMoodboard(name).then((moodboard) => {
            setDialog(null)
            navigate(`/app/moodboards/${moodboard.id}`)
          })
        }}
      />

      <PromptDialog
        open={dialog === 'board'}
        title="Nuevo tablero"
        label="Nombre del tablero"
        placeholder="Lanzamiento de campaña"
        onClose={() => setDialog(null)}
        onSubmit={(name) => {
          void createBoard(name).then((board) => {
            setDialog(null)
            navigate(`/app/boards/${board.id}`)
          })
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Restablecer los datos de demostración"
        message="Se borra todo lo que hay en este navegador y vuelven el espacio, el moodboard y el tablero de ejemplo. No se puede deshacer."
        confirmLabel="Restablecer"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false)
          void resetDemo()
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title={`Eliminar "${current?.name ?? ''}"`}
        message="Se eliminan también sus tableros, moodboards e imágenes guardadas. No se puede deshacer."
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!current) return
          setConfirmDelete(false)
          void deleteWorkspace(current.id).then(() => toast({ title: 'Espacio eliminado', tone: 'success' }))
        }}
      />
    </div>
  )
}

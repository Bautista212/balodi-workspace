import { CheckSquare, Layers } from 'lucide-react'

const columns = [
  { title: 'Ideas', color: '#8b7cf6', tasks: ['Concepto de campaña', 'Referencias'] },
  { title: 'En proceso', color: '#fd3a00', tasks: ['Guiones de reels', 'Sesión de fotos'] },
  { title: 'Listo', color: '#17845a', tasks: ['Brief aprobado'] },
]

/** Vista reducida de la interfaz real, para mostrar el producto en la landing. */
export function ProductPeek() {
  return (
    <div className="w-full overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_60px_-30px_rgba(18,16,16,0.55)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--balodi-orange)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--border-strong)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--border-strong)]" />
        <span className="ml-2 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)]">
          <CheckSquare size={12} /> Lanzamiento de campaña
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 p-3">
        {columns.map((column) => (
          <div key={column.title} className="rounded-[10px] bg-[var(--surface-muted)] p-2">
            <div className="mb-2 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: column.color }} />
              <span className="text-[11px] font-bold">{column.title}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {column.tasks.map((task) => (
                <div
                  key={task}
                  className="rounded-[8px] border border-[var(--border)] bg-white px-2 py-1.5 text-[11px] leading-tight"
                >
                  {task}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-[var(--border)] px-3 py-2 text-[11px] text-[var(--text-secondary)]">
        <Layers size={12} /> Moodboard vinculado: Identidad de marca
      </div>
    </div>
  )
}

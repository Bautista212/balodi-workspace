import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  Home,
  Layers,
  Plus,
  Search,
  SquareKanban,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Misc'
import { Modal } from '@/components/ui/Modal'
import { LogoMark } from '@/components/Logo'
import { brand } from '@/config/brand'
import { isLocalMode } from '@/config/env'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/useUiStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'

const navItems = [
  { to: '/app', label: 'Inicio', icon: Home, end: true },
  { to: '/app/moodboards', label: 'Moodboards', icon: Layers, end: false },
  { to: '/app/boards', label: 'Tableros', icon: SquareKanban, end: false },
  { to: '/about', label: 'Sobre la herramienta', icon: CircleHelp, end: false },
]

function WorkspaceSwitcher({ collapsed }: { collapsed: boolean }) {
  const { workspaces, currentWorkspaceId, selectWorkspace } = useWorkspaceStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = workspaces.find((workspace) => workspace.id === currentWorkspaceId)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (collapsed) {
    return (
      <div className="flex justify-center py-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[var(--surface-sunken)] text-xs font-bold">
          {(current?.name ?? '?').slice(0, 1).toUpperCase()}
        </span>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left transition-colors hover:bg-[var(--surface-muted)]"
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Espacio
          </span>
          <span className="block truncate text-sm font-bold">{current?.name ?? 'Sin espacio'}</span>
        </span>
        <ChevronDown size={16} className="shrink-0 text-[var(--text-secondary)]" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-pop)]">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              type="button"
              onClick={() => {
                void selectWorkspace(workspace.id)
                setOpen(false)
              }}
              className={cn(
                'block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--surface-muted)]',
                workspace.id === currentWorkspaceId && 'font-bold text-[var(--balodi-orange)]',
              )}
            >
              {workspace.name}
            </button>
          ))}
          <Link
            to="/app"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 border-t border-[var(--border)] px-3 py-2 text-sm font-semibold"
          >
            <Plus size={14} /> Nuevo espacio
          </Link>
        </div>
      )}
    </div>
  )
}

function QuickSearch() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const boards = useWorkspaceStore((state) => state.boards)
  const moodboards = useWorkspaceStore((state) => state.moodboards)
  const navigate = useNavigate()

  const results = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return []
    return [
      ...moodboards
        .filter((moodboard) => moodboard.name.toLowerCase().includes(term))
        .map((moodboard) => ({ id: moodboard.id, name: moodboard.name, to: `/app/moodboards/${moodboard.id}`, kind: 'Moodboard' })),
      ...boards
        .filter((board) => board.name.toLowerCase().includes(term))
        .map((board) => ({ id: board.id, name: board.name, to: `/app/boards/${board.id}`, kind: 'Tablero' })),
    ].slice(0, 6)
  }, [query, boards, moodboards])

  return (
    <div className="relative w-full max-w-sm">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
      />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        placeholder="Buscar moodboards y tableros"
        aria-label="Buscar"
        className="pl-9"
      />
      {focused && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-pop)]">
          {results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                onClick={() => {
                  navigate(result.to)
                  setQuery('')
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[var(--surface-muted)]"
              >
                <span className="truncate">{result.name}</span>
                <span className="ml-3 shrink-0 text-[11px] text-[var(--text-secondary)]">{result.kind}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function AppLayout() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const bootstrap = useWorkspaceStore((state) => state.bootstrap)
  const ready = useWorkspaceStore((state) => state.ready)
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  return (
    <div className="flex min-h-screen bg-[var(--surface-muted)]">
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-[width] duration-200 md:flex',
          collapsed ? 'w-[68px]' : 'w-[248px]',
        )}
      >
        <div className={cn('flex items-center gap-2 px-3 py-4', collapsed && 'justify-center')}>
          <Link to="/" aria-label="Ir a la landing">
            <LogoMark />
          </Link>
          {!collapsed && (
            <span className="text-sm font-black tracking-[-0.03em]" style={{ fontFamily: 'var(--font-display)' }}>
              Workspace
            </span>
          )}
        </div>

        <div className={cn('px-3', collapsed && 'px-2')}>
          <WorkspaceSwitcher collapsed={collapsed} />
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1 px-2" aria-label="Secciones">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-semibold transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-[var(--balodi-orange-soft)] text-[var(--balodi-orange-strong)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]',
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && item.label}
            </NavLink>
          ))}

          <a
            href={brand.links.contact}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'mt-1 flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]',
              collapsed && 'justify-center px-0',
            )}
            title={collapsed ? 'Contactar a Balodi' : undefined}
          >
            <LogoMark size={18} />
            {!collapsed && 'Contactar a Balodi'}
          </a>
        </nav>

        <div className={cn('border-t border-[var(--border)] p-3', collapsed && 'px-2')}>
          {!collapsed && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              {isLocalMode && <Badge>Modo local</Badge>}
              <Badge tone="orange">{brand.version}</Badge>
            </div>
          )}
          <div className={cn('flex items-center gap-2', collapsed && 'flex-col')}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-sunken)]">
              <User size={15} />
            </span>
            {!collapsed && <span className="flex-1 truncate text-[13px] font-semibold">Acceso local</span>}
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
              className="rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            >
              {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
          <Link to="/app" className="md:hidden" aria-label="Inicio">
            <LogoMark />
          </Link>
          <QuickSearch />
          <div className="ml-auto flex items-center gap-2">
            {isLocalMode && (
              <span className="hidden items-center gap-1.5 text-[12px] font-semibold text-[var(--text-secondary)] sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" /> Modo local
              </span>
            )}
            <Button variant="ghost" size="sm" icon={<CircleHelp size={16} />} onClick={() => setHelpOpen(true)}>
              Ayuda
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1">{ready ? <Outlet /> : <BootSkeleton />}</main>

        <nav
          className="sticky bottom-0 z-30 flex items-center justify-around border-t border-[var(--border)] bg-[var(--surface)] py-1.5 md:hidden"
          aria-label="Navegación móvil"
        >
          {navItems.slice(0, 3).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-semibold',
                  isActive ? 'text-[var(--balodi-orange)]' : 'text-[var(--text-secondary)]',
                )
              }
            >
              <item.icon size={19} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Modal open={helpOpen} title="Ayuda rápida" onClose={() => setHelpOpen(false)}>
        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          <li>
            <strong className="text-[var(--text-primary)]">Moodboard:</strong> V selecciona, H mueve el lienzo, N crea
            una nota, T un texto. Rueda + Ctrl para zoom.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Tablero:</strong> arrastrá tarjetas entre columnas y usá el
            buscador para filtrar.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Tus datos</strong> se guardan en este navegador. Exportá un
            backup desde Inicio.
          </li>
        </ul>
        <div className="mt-5 rounded-[12px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <p className="text-sm font-bold">{brand.cta.contextual.title}</p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{brand.cta.contextual.body}</p>
          <a href={brand.links.contact} target="_blank" rel="noreferrer" className="mt-3 inline-block">
            <Button size="sm">{brand.cta.contextual.button}</Button>
          </a>
        </div>
      </Modal>
    </div>
  )
}

function BootSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="h-8 w-56 animate-pulse rounded-[10px] bg-[var(--surface-sunken)]" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="h-40 animate-pulse rounded-[16px] bg-[var(--surface-sunken)]" />
        <div className="h-40 animate-pulse rounded-[16px] bg-[var(--surface-sunken)]" />
      </div>
    </div>
  )
}

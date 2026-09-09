import { useState } from 'react'
import {
  Circle,
  Download,
  Grid2x2,
  Hand,
  Image as ImageIcon,
  Link2,
  Minus,
  MousePointer2,
  Redo2,
  Shapes,
  Square,
  StickyNote,
  Type,
  Undo2,
  Video,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Tooltip } from '@/components/ui/Misc'
import { cn } from '@/lib/utils'
import { useMoodboardStore, type Tool } from '@/stores/useMoodboardStore'

interface ToolbarProps {
  onPickImage: () => void
  onAddLink: () => void
  onAddVideo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onExport: () => void
  exporting: boolean
}

function ToolButton({
  label,
  active,
  onClick,
  children,
  disabled,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={active}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-[9px] transition-colors disabled:opacity-40',
          active
            ? 'bg-[var(--balodi-black)] text-white'
            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]',
        )}
      >
        {children}
      </button>
    </Tooltip>
  )
}

export function MoodboardToolbar({
  onPickImage,
  onAddLink,
  onAddVideo,
  onZoomIn,
  onZoomOut,
  onExport,
  exporting,
}: ToolbarProps) {
  const { tool, setTool, undo, redo, past, future, showGrid, toggleGrid } = useMoodboardStore()
  const [shapesOpen, setShapesOpen] = useState(false)

  const pick = (next: Tool) => () => setTool(next)

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-1.5 py-1 shadow-[var(--shadow-card)]">
      <ToolButton label="Seleccionar (V)" active={tool === 'select'} onClick={pick('select')}>
        <MousePointer2 size={17} />
      </ToolButton>
      <ToolButton label="Mano (H)" active={tool === 'hand'} onClick={pick('hand')}>
        <Hand size={17} />
      </ToolButton>

      <span className="mx-1 h-6 w-px bg-[var(--border)]" />

      <ToolButton label="Nota (N)" active={tool === 'note'} onClick={pick('note')}>
        <StickyNote size={17} />
      </ToolButton>
      <ToolButton label="Texto (T)" active={tool === 'text'} onClick={pick('text')}>
        <Type size={17} />
      </ToolButton>
      <ToolButton label="Imagen" onClick={onPickImage}>
        <ImageIcon size={17} />
      </ToolButton>
      <ToolButton label="Enlace" onClick={onAddLink}>
        <Link2 size={17} />
      </ToolButton>
      <ToolButton label="Video" onClick={onAddVideo}>
        <Video size={17} />
      </ToolButton>

      <div className="relative">
        <ToolButton
          label="Formas"
          active={tool === 'rect' || tool === 'ellipse' || tool === 'line'}
          onClick={() => setShapesOpen((open) => !open)}
        >
          <Shapes size={17} />
        </ToolButton>
        {shapesOpen && (
          <div className="absolute left-0 top-[calc(100%+6px)] z-30 flex gap-1 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-pop)]">
            <ToolButton
              label="Rectángulo"
              active={tool === 'rect'}
              onClick={() => {
                setTool('rect')
                setShapesOpen(false)
              }}
            >
              <Square size={17} />
            </ToolButton>
            <ToolButton
              label="Círculo"
              active={tool === 'ellipse'}
              onClick={() => {
                setTool('ellipse')
                setShapesOpen(false)
              }}
            >
              <Circle size={17} />
            </ToolButton>
            <ToolButton
              label="Línea"
              active={tool === 'line'}
              onClick={() => {
                setTool('line')
                setShapesOpen(false)
              }}
            >
              <Minus size={17} />
            </ToolButton>
          </div>
        )}
      </div>

      <span className="mx-1 h-6 w-px bg-[var(--border)]" />

      <ToolButton label="Deshacer (Ctrl+Z)" onClick={undo} disabled={past.length === 0}>
        <Undo2 size={17} />
      </ToolButton>
      <ToolButton label="Rehacer (Ctrl+Y)" onClick={redo} disabled={future.length === 0}>
        <Redo2 size={17} />
      </ToolButton>

      <span className="mx-1 h-6 w-px bg-[var(--border)]" />

      <ToolButton label="Alejar" onClick={onZoomOut}>
        <ZoomOut size={17} />
      </ToolButton>
      <ToolButton label="Acercar" onClick={onZoomIn}>
        <ZoomIn size={17} />
      </ToolButton>
      <ToolButton label="Grilla" active={showGrid} onClick={toggleGrid}>
        <Grid2x2 size={17} />
      </ToolButton>
      <ToolButton label="Exportar PNG" onClick={onExport} disabled={exporting}>
        <Download size={17} />
      </ToolButton>
    </div>
  )
}

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type RefObject } from 'react'
import { Maximize2, Minus, Plus } from 'lucide-react'
import { clamp, uid } from '@/lib/utils'
import { useMoodboardStore, type Tool } from '@/stores/useMoodboardStore'
import type { MoodItem } from '@/types'
import { CanvasItemView } from './CanvasItemView'

export interface CanvasApi {
  zoomBy: (factor: number) => void
  zoomTo: (scale: number) => void
  fitToContent: () => void
  /** Punto del mundo en el centro de la pantalla, para insertar elementos nuevos. */
  centerPoint: () => { x: number; y: number }
}

interface ContextMenuState {
  x: number
  y: number
  itemId: string | null
}

const MIN_SCALE = 0.15
const MAX_SCALE = 4

type Interaction =
  | { kind: 'pan'; clientX: number; clientY: number; vpX: number; vpY: number }
  | { kind: 'drag'; startX: number; startY: number; origin: Record<string, { x: number; y: number }> }
  | {
      kind: 'resize'
      id: string
      handle: 'nw' | 'ne' | 'sw' | 'se'
      startX: number
      startY: number
      box: { x: number; y: number; width: number; height: number }
    }
  | { kind: 'marquee'; startX: number; startY: number }
  | null

export function MoodboardCanvas({
  apiRef,
  onContextMenu,
}: {
  apiRef: RefObject<CanvasApi | null>
  onContextMenu: (state: ContextMenuState) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const interactionRef = useRef<Interaction>(null)
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const {
    items,
    viewport,
    selection,
    tool,
    showGrid,
    setViewport,
    setSelection,
    addToSelection,
    patchItems,
    beginInteraction,
    endInteraction,
    addItem,
    setTool,
  } = useMoodboardStore()

  const toWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }
      return {
        x: (clientX - rect.left - viewport.x) / viewport.scale,
        y: (clientY - rect.top - viewport.y) / viewport.scale,
      }
    },
    [viewport],
  )

  /* ------------------------------ zoom / fit ----------------------------- */
  const zoomAt = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const px = (clientX ?? rect.left + rect.width / 2) - rect.left
      const py = (clientY ?? rect.top + rect.height / 2) - rect.top
      const nextScale = clamp(viewport.scale * factor, MIN_SCALE, MAX_SCALE)
      const ratio = nextScale / viewport.scale
      setViewport({
        scale: nextScale,
        x: px - (px - viewport.x) * ratio,
        y: py - (py - viewport.y) * ratio,
      })
    },
    [viewport, setViewport],
  )

  const fitToContent = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    if (items.length === 0) {
      setViewport({ x: 0, y: 0, scale: 1 })
      return
    }
    const minX = Math.min(...items.map((item) => item.x))
    const minY = Math.min(...items.map((item) => item.y))
    const maxX = Math.max(...items.map((item) => item.x + item.width))
    const maxY = Math.max(...items.map((item) => item.y + item.height))
    const padding = 80
    const scale = clamp(
      Math.min((rect.width - padding * 2) / (maxX - minX), (rect.height - padding * 2) / (maxY - minY)),
      MIN_SCALE,
      1.5,
    )
    setViewport({
      scale,
      x: rect.width / 2 - ((minX + maxX) / 2) * scale,
      y: rect.height / 2 - ((minY + maxY) / 2) * scale,
    })
  }, [items, setViewport])

  useImperativeHandle(
    apiRef,
    () => ({
      zoomBy: (factor) => zoomAt(factor),
      zoomTo: (scale) => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        zoomAt(clamp(scale, MIN_SCALE, MAX_SCALE) / viewport.scale)
      },
      fitToContent,
      centerPoint: () => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return { x: 0, y: 0 }
        return toWorld(rect.left + rect.width / 2, rect.top + rect.height / 2)
      },
    }),
    [zoomAt, fitToContent, toWorld, viewport.scale],
  )

  /* --------------------------------- wheel -------------------------------- */
  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        zoomAt(event.deltaY < 0 ? 1.12 : 1 / 1.12, event.clientX, event.clientY)
      } else {
        setViewport({ ...viewport, x: viewport.x - event.deltaX, y: viewport.y - event.deltaY })
      }
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [zoomAt, setViewport, viewport])

  /* ------------------------------ interacciones --------------------------- */
  const stopInteraction = useCallback(() => {
    const interaction = interactionRef.current
    if (interaction?.kind === 'drag' || interaction?.kind === 'resize') endInteraction()
    interactionRef.current = null
    setMarquee(null)
  }, [endInteraction])

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const interaction = interactionRef.current
      if (!interaction) return
      if (interaction.kind === 'pan') {
        setViewport({
          ...viewport,
          x: interaction.vpX + (event.clientX - interaction.clientX),
          y: interaction.vpY + (event.clientY - interaction.clientY),
        })
        return
      }
      const point = toWorld(event.clientX, event.clientY)
      if (interaction.kind === 'drag') {
        const dx = point.x - interaction.startX
        const dy = point.y - interaction.startY
        const ids = Object.keys(interaction.origin)
        useMoodboardStore.setState((state) => ({
          items: state.items.map((item) =>
            ids.includes(item.id)
              ? { ...item, x: interaction.origin[item.id].x + dx, y: interaction.origin[item.id].y + dy }
              : item,
          ),
        }))
      } else if (interaction.kind === 'resize') {
        const dx = point.x - interaction.startX
        const dy = point.y - interaction.startY
        const box = interaction.box
        let { x, y, width, height } = box
        if (interaction.handle === 'se') {
          width = box.width + dx
          height = box.height + dy
        } else if (interaction.handle === 'sw') {
          x = box.x + dx
          width = box.width - dx
          height = box.height + dy
        } else if (interaction.handle === 'ne') {
          y = box.y + dy
          width = box.width + dx
          height = box.height - dy
        } else {
          x = box.x + dx
          y = box.y + dy
          width = box.width - dx
          height = box.height - dy
        }
        if (width < 40 || height < 32) return
        useMoodboardStore.setState((state) => ({
          items: state.items.map((item) =>
            item.id === interaction.id ? { ...item, x, y, width, height } : item,
          ),
        }))
      } else if (interaction.kind === 'marquee') {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        const start = {
          x: interaction.startX * viewport.scale + viewport.x,
          y: interaction.startY * viewport.scale + viewport.y,
        }
        const current = { x: event.clientX - rect.left, y: event.clientY - rect.top }
        setMarquee({
          x: Math.min(start.x, current.x),
          y: Math.min(start.y, current.y),
          w: Math.abs(current.x - start.x),
          h: Math.abs(current.y - start.y),
        })
        const a = { x: interaction.startX, y: interaction.startY }
        const b = point
        const box = {
          x1: Math.min(a.x, b.x),
          y1: Math.min(a.y, b.y),
          x2: Math.max(a.x, b.x),
          y2: Math.max(a.y, b.y),
        }
        setSelection(
          useMoodboardStore
            .getState()
            .items.filter(
              (item) =>
                item.x < box.x2 && item.x + item.width > box.x1 && item.y < box.y2 && item.y + item.height > box.y1,
            )
            .map((item) => item.id),
        )
      }
    }
    const onUp = () => stopInteraction()
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [toWorld, viewport, setViewport, setSelection, stopInteraction])

  const createAt = (point: { x: number; y: number }, kind: Tool) => {
    const base = { x: point.x, y: point.y, locked: false, id: uid() }
    if (kind === 'note') {
      addItem({ ...base, type: 'note', width: 220, height: 180, text: 'Nueva nota', color: '#ffd66b', fontSize: 18 })
    } else if (kind === 'text') {
      addItem({ ...base, type: 'text', width: 320, height: 60, text: 'Escribí algo', fontSize: 28 })
      setEditingId(base.id)
    } else if (kind === 'rect') {
      addItem({ ...base, type: 'rect', width: 220, height: 160, color: '#fd3a00' })
    } else if (kind === 'ellipse') {
      addItem({ ...base, type: 'ellipse', width: 180, height: 180, color: '#2f80ed' })
    } else if (kind === 'line') {
      addItem({ ...base, type: 'line', width: 240, height: 24, color: '#121010' })
    }
    setTool('select')
  }

  const onBackgroundPointerDown = (event: React.PointerEvent) => {
    if (event.button === 2) return
    setEditingId(null)
    const point = toWorld(event.clientX, event.clientY)

    if (tool !== 'select' && tool !== 'hand') {
      createAt(point, tool)
      return
    }
    if (tool === 'hand' || event.button === 1 || event.altKey) {
      interactionRef.current = {
        kind: 'pan',
        clientX: event.clientX,
        clientY: event.clientY,
        vpX: viewport.x,
        vpY: viewport.y,
      }
      return
    }
    setSelection([])
    interactionRef.current = { kind: 'marquee', startX: point.x, startY: point.y }
  }

  const onItemPointerDown = (event: React.PointerEvent, item: MoodItem) => {
    if (event.button === 2) return
    event.stopPropagation()
    if (tool === 'hand') {
      interactionRef.current = {
        kind: 'pan',
        clientX: event.clientX,
        clientY: event.clientY,
        vpX: viewport.x,
        vpY: viewport.y,
      }
      return
    }
    setEditingId((current) => (current === item.id ? current : null))

    let nextSelection = selection
    if (event.shiftKey) {
      addToSelection(item.id)
      nextSelection = selection.includes(item.id)
        ? selection.filter((id) => id !== item.id)
        : [...selection, item.id]
    } else if (!selection.includes(item.id)) {
      nextSelection = [item.id]
      setSelection(nextSelection)
    }
    if (item.locked) return

    const point = toWorld(event.clientX, event.clientY)
    const origin: Record<string, { x: number; y: number }> = {}
    for (const candidate of items) {
      if (nextSelection.includes(candidate.id) && !candidate.locked) {
        origin[candidate.id] = { x: candidate.x, y: candidate.y }
      }
    }
    beginInteraction()
    interactionRef.current = { kind: 'drag', startX: point.x, startY: point.y, origin }
  }

  const startResize = (event: React.PointerEvent, item: MoodItem, handle: 'nw' | 'ne' | 'sw' | 'se') => {
    event.stopPropagation()
    const point = toWorld(event.clientX, event.clientY)
    beginInteraction()
    interactionRef.current = {
      kind: 'resize',
      id: item.id,
      handle,
      startX: point.x,
      startY: point.y,
      box: { x: item.x, y: item.y, width: item.width, height: item.height },
    }
  }

  const selectedSingle = selection.length === 1 ? items.find((item) => item.id === selection[0]) : undefined

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none overflow-hidden bg-[var(--surface)]"
      style={{
        cursor: tool === 'hand' ? 'grab' : tool === 'select' ? 'default' : 'crosshair',
        backgroundImage: showGrid
          ? 'radial-gradient(circle at 1px 1px, var(--border-strong) 1px, transparent 0)'
          : undefined,
        backgroundSize: showGrid ? `${24 * viewport.scale}px ${24 * viewport.scale}px` : undefined,
        backgroundPosition: showGrid ? `${viewport.x}px ${viewport.y}px` : undefined,
      }}
      onPointerDown={onBackgroundPointerDown}
      onContextMenu={(event) => {
        event.preventDefault()
        const target = (event.target as HTMLElement).closest('[data-item-id]')
        const itemId = target?.getAttribute('data-item-id') ?? null
        if (itemId && !selection.includes(itemId)) setSelection([itemId])
        onContextMenu({ x: event.clientX, y: event.clientY, itemId })
      }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})` }}
      >
        {items.map((item) => (
          <div key={item.id} onPointerDown={(event) => onItemPointerDown(event, item)}>
            <CanvasItemView
              item={item}
              selected={selection.includes(item.id)}
              editing={editingId === item.id}
              onStartEdit={() => !item.locked && setEditingId(item.id)}
              onCommitText={(text) => {
                setEditingId(null)
                if (text !== item.text) patchItems([item.id], { text })
              }}
            />
          </div>
        ))}

        {selectedSingle && !selectedSingle.locked && (
          <>
            {(['nw', 'ne', 'sw', 'se'] as const).map((handle) => (
              <button
                key={handle}
                type="button"
                aria-label={`Redimensionar ${handle}`}
                onPointerDown={(event) => startResize(event, selectedSingle, handle)}
                className="absolute h-3 w-3 rounded-full border-2 border-[var(--balodi-orange)] bg-white"
                style={{
                  zIndex: 10000,
                  transform: `scale(${1 / viewport.scale})`,
                  left:
                    (handle === 'nw' || handle === 'sw' ? selectedSingle.x : selectedSingle.x + selectedSingle.width) -
                    6,
                  top:
                    (handle === 'nw' || handle === 'ne' ? selectedSingle.y : selectedSingle.y + selectedSingle.height) -
                    6,
                  cursor: handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize',
                }}
              />
            ))}
          </>
        )}
      </div>

      {marquee && (
        <div
          className="pointer-events-none absolute border border-[var(--balodi-orange)] bg-[var(--balodi-orange)]/10"
          style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
        />
      )}

      <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-1.5 py-1 shadow-[var(--shadow-card)]">
        <button
          type="button"
          aria-label="Alejar"
          onClick={() => zoomAt(1 / 1.2)}
          className="rounded-full p-1.5 hover:bg-[var(--surface-muted)]"
        >
          <Minus size={15} />
        </button>
        <button
          type="button"
          onClick={() => zoomAt(1 / viewport.scale)}
          className="min-w-[46px] text-[12px] font-semibold"
          aria-label="Restablecer zoom"
        >
          {Math.round(viewport.scale * 100)}%
        </button>
        <button
          type="button"
          aria-label="Acercar"
          onClick={() => zoomAt(1.2)}
          className="rounded-full p-1.5 hover:bg-[var(--surface-muted)]"
        >
          <Plus size={15} />
        </button>
        <button
          type="button"
          aria-label="Centrar contenido"
          onClick={fitToContent}
          className="rounded-full p-1.5 hover:bg-[var(--surface-muted)]"
        >
          <Maximize2 size={15} />
        </button>
      </div>
    </div>
  )
}

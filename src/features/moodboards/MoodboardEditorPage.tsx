import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  Copy,
  Loader2,
  Lock,
  Palette,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { EmptyState, Skeleton } from '@/components/ui/Misc'
import { repository } from '@/repositories'
import { exportMoodboardPng } from '@/lib/exportPng'
import { MEDIA_LIMITS, processImageFile, resolveEmbed } from '@/lib/media'
import { downloadBlob, uid } from '@/lib/utils'
import { toast } from '@/stores/useUiStore'
import { useMoodboardStore } from '@/stores/useMoodboardStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import type { MoodItem } from '@/types'
import { MoodboardCanvas, type CanvasApi } from './canvas/MoodboardCanvas'
import { MoodboardToolbar } from './canvas/MoodboardToolbar'

type DialogKind = 'image-url' | 'link' | 'video' | null

const NOTE_COLORS = ['#ffd66b', '#ffb4a0', '#b7e4c7', '#a9d6ff', '#e6d3ff', '#ffffff']

export function MoodboardEditorPage() {
  const { moodboardId } = useParams<{ moodboardId: string }>()
  const {
    moodboard,
    items,
    selection,
    loading,
    error,
    saveStatus,
    load,
    leave,
    addItem,
    patchItems,
    deleteSelection,
    duplicateSelection,
    copySelection,
    paste,
    bringForward,
    sendBackward,
    toggleLock,
    undo,
    redo,
    setTool,
  } = useMoodboardStore()
  const currentWorkspaceId = useWorkspaceStore((state) => state.currentWorkspaceId)

  const apiRef = useRef<CanvasApi | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [dialog, setDialog] = useState<DialogKind>(null)
  const [dialogValue, setDialogValue] = useState('')
  const [dialogTitle, setDialogTitle] = useState('')
  const [exporting, setExporting] = useState(false)
  const [menu, setMenu] = useState<{ x: number; y: number; itemId: string | null } | null>(null)

  useEffect(() => {
    if (moodboardId) void load(moodboardId)
    return () => leave()
  }, [moodboardId, load, leave])

  /* ------------------------------- atajos -------------------------------- */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, [contenteditable="true"]')) return
      const meta = event.metaKey || event.ctrlKey

      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (meta && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo()
        return
      }
      if (meta && event.key.toLowerCase() === 'c') return copySelection()
      if (meta && event.key.toLowerCase() === 'v') return paste()
      if (meta && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        return duplicateSelection()
      }
      if (meta && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        useMoodboardStore.getState().setSelection(useMoodboardStore.getState().items.map((item) => item.id))
        return
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        return deleteSelection()
      }
      if (event.key === 'Escape') return useMoodboardStore.getState().setSelection([])
      if (event.key === ']') return bringForward()
      if (event.key === '[') return sendBackward()
      if (event.key.startsWith('Arrow') && selection.length > 0) {
        event.preventDefault()
        const step = event.shiftKey ? 10 : 1
        const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
        const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
        useMoodboardStore.setState((state) => ({
          items: state.items.map((item) =>
            selection.includes(item.id) && !item.locked ? { ...item, x: item.x + dx, y: item.y + dy } : item,
          ),
        }))
        return
      }
      if (event.key.toLowerCase() === 'v') setTool('select')
      if (event.key.toLowerCase() === 'h') setTool('hand')
      if (event.key.toLowerCase() === 'n') setTool('note')
      if (event.key.toLowerCase() === 't') setTool('text')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    undo,
    redo,
    copySelection,
    paste,
    duplicateSelection,
    deleteSelection,
    bringForward,
    sendBackward,
    setTool,
    selection,
  ])

  useEffect(() => {
    const close = () => setMenu(null)
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [])

  /* ------------------------------- imagenes ------------------------------- */
  const onFile = async (file: File) => {
    if (!MEDIA_LIMITS.acceptedMime.includes(file.type)) {
      toast({ title: 'Formato no soportado', description: 'Usá PNG, JPG, WEBP, GIF o AVIF.', tone: 'warning' })
      return
    }
    if (file.size > MEDIA_LIMITS.maxUploadBytes) {
      toast({
        title: 'La imagen es muy pesada',
        description: `Vamos a comprimirla, pero conviene subir menos de ${Math.round(
          MEDIA_LIMITS.maxUploadBytes / 1024 / 1024,
        )} MB.`,
        tone: 'warning',
      })
    }
    if (!moodboard || !currentWorkspaceId) return
    try {
      const processed = await processImageFile(file)
      const asset = await repository.moodboards.putImageAsset({
        workspaceId: currentWorkspaceId,
        moodboardId: moodboard.id,
        name: file.name,
        blob: processed.blob,
        width: processed.width,
        height: processed.height,
        thumbnail: processed.thumbnail,
      })
      const center = apiRef.current?.centerPoint() ?? { x: 0, y: 0 }
      const width = 320
      const height = Math.round((processed.height / processed.width) * width)
      addItem({
        id: uid(),
        type: 'image',
        x: center.x - width / 2,
        y: center.y - height / 2,
        width,
        height,
        locked: false,
        assetId: asset.id,
        text: file.name,
      })
      toast({ title: 'Imagen agregada', tone: 'success' })
    } catch (issue) {
      toast({
        title: 'No se pudo procesar la imagen',
        description: issue instanceof Error ? issue.message : undefined,
        tone: 'danger',
      })
    }
  }

  /* -------------------------------- dialogos ------------------------------ */
  const submitDialog = () => {
    const center = apiRef.current?.centerPoint() ?? { x: 0, y: 0 }
    const value = dialogValue.trim()
    if (!value) return

    if (dialog === 'image-url') {
      addItem({
        id: uid(),
        type: 'image',
        x: center.x - 160,
        y: center.y - 110,
        width: 320,
        height: 220,
        locked: false,
        src: value,
        text: dialogTitle,
      })
    } else if (dialog === 'link') {
      addItem({
        id: uid(),
        type: 'link',
        x: center.x - 150,
        y: center.y - 48,
        width: 300,
        height: 96,
        locked: false,
        url: value,
        text: dialogTitle || value,
      })
    } else if (dialog === 'video') {
      const embed = resolveEmbed(value)
      if (!embed) {
        toast({ title: 'Ese enlace no parece válido', tone: 'warning' })
        return
      }
      const isPlayer = embed.provider !== 'link'
      addItem({
        id: uid(),
        type: 'video',
        x: center.x - 200,
        y: center.y - 115,
        width: isPlayer ? 400 : 300,
        height: isPlayer ? 225 : 96,
        locked: false,
        url: value,
        embedUrl: embed.embedUrl,
        provider: embed.provider,
        text: dialogTitle || embed.title,
      })
      if (embed.provider === 'link') {
        toast({ title: 'Lo agregamos como tarjeta de enlace', description: 'No pudimos embeber ese video.' })
      }
    }
    setDialog(null)
    setDialogValue('')
    setDialogTitle('')
  }

  const exportPng = useCallback(async () => {
    if (items.length === 0) {
      toast({ title: 'No hay nada para exportar', tone: 'warning' })
      return
    }
    setExporting(true)
    try {
      const blob = await exportMoodboardPng(items, async (item: MoodItem) => {
        const url = item.assetId ? await repository.moodboards.getImageUrl(item.assetId) : item.src
        if (!url) return null
        return new Promise<HTMLImageElement | null>((resolve) => {
          const image = new Image()
          if (!item.assetId) image.crossOrigin = 'anonymous'
          image.onload = () => resolve(image)
          image.onerror = () => resolve(null)
          image.src = url
        })
      })
      if (blob) {
        downloadBlob(blob, `${moodboard?.name ?? 'moodboard'}.png`)
        toast({ title: 'Moodboard exportado', tone: 'success' })
      }
    } catch (issue) {
      toast({
        title: 'No se pudo exportar',
        description: issue instanceof Error ? issue.message : 'Puede que alguna imagen externa lo impida.',
        tone: 'danger',
      })
    } finally {
      setExporting(false)
    }
  }, [items, moodboard])

  if (loading) {
    return (
      <div className="px-5 py-8">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-5 h-[60vh] w-full" />
      </div>
    )
  }

  if (error || !moodboard) {
    return (
      <div className="px-5 py-16">
        <EmptyState
          title="No encontramos ese moodboard"
          description={error ?? 'Puede que lo hayas eliminado o que el enlace esté mal.'}
          action={
            <Link to="/app/moodboards">
              <Button>Volver a moodboards</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const selectedItems = items.filter((item) => selection.includes(item.id))
  const colorable = selectedItems.some((item) => ['note', 'rect', 'ellipse', 'line'].includes(item.type))

  return (
    <div className="flex h-[calc(100vh-49px)] flex-col md:h-screen">
      <header className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
        <Link
          to="/app/moodboards"
          aria-label="Volver a moodboards"
          className="rounded-md p-1.5 hover:bg-[var(--surface-muted)]"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="truncate text-lg">{moodboard.name}</h1>
        <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)]">
          {saveStatus === 'saving' ? (
            <>
              <Loader2 size={12} className="animate-spin" /> Guardando…
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <Check size={12} /> Guardado
            </>
          ) : null}
        </span>
        <div className="ml-auto">
          <MoodboardToolbar
            onPickImage={() => fileRef.current?.click()}
            onAddLink={() => {
              setDialogValue('')
              setDialogTitle('')
              setDialog('link')
            }}
            onAddVideo={() => {
              setDialogValue('')
              setDialogTitle('')
              setDialog('video')
            }}
            onZoomIn={() => apiRef.current?.zoomBy(1.2)}
            onZoomOut={() => apiRef.current?.zoomBy(1 / 1.2)}
            onExport={() => void exportPng()}
            exporting={exporting}
          />
        </div>
      </header>

      {selection.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2">
          <span className="text-[12px] font-semibold text-[var(--text-secondary)]">
            {selection.length} seleccionado{selection.length > 1 ? 's' : ''}
          </span>
          {colorable && (
            <span className="flex items-center gap-1.5">
              <Palette size={14} className="text-[var(--text-secondary)]" />
              {NOTE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Color ${color}`}
                  onClick={() => patchItems(selection, { color })}
                  className="h-5 w-5 rounded-full border border-black/10"
                  style={{ background: color }}
                />
              ))}
            </span>
          )}
          <Button size="sm" variant="ghost" icon={<Copy size={14} />} onClick={duplicateSelection}>
            Duplicar
          </Button>
          <Button size="sm" variant="ghost" icon={<ArrowUpDown size={14} />} onClick={bringForward}>
            Traer adelante
          </Button>
          <Button size="sm" variant="ghost" icon={<Lock size={14} />} onClick={toggleLock}>
            Bloquear
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-[var(--danger)]"
            icon={<Trash2 size={14} />}
            onClick={deleteSelection}
          >
            Eliminar
          </Button>
        </div>
      )}

      <p className="border-b border-[var(--border)] bg-[var(--balodi-orange-soft)] px-4 py-1.5 text-[12px] text-[var(--balodi-orange-strong)] md:hidden">
        El moodboard se ve mejor en una computadora. Acá podés mirarlo y moverlo.
      </p>

      <div className="relative flex-1">
        {items.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
            <div className="pointer-events-auto max-w-sm rounded-[16px] border border-dashed border-[var(--border-strong)] bg-[var(--surface)]/95 p-6 text-center">
              <h2 className="text-xl">Lienzo en blanco</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Elegí una herramienta y hacé clic en el lienzo. Nota (N), texto (T), o subí una imagen desde la barra
                de arriba.
              </p>
              <Button className="mt-4" size="sm" onClick={() => setTool('note')}>
                Crear una nota
              </Button>
            </div>
          </div>
        )}
        <MoodboardCanvas apiRef={apiRef} onContextMenu={setMenu} />
      </div>

      {menu && (
        <ul
          className="fixed z-50 min-w-[184px] overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)] py-1 text-sm shadow-[var(--shadow-pop)]"
          style={{ left: menu.x, top: menu.y }}
        >
          {menu.itemId ? (
            <>
              <MenuItem label="Duplicar" shortcut="Ctrl+D" onClick={duplicateSelection} />
              <MenuItem label="Copiar" shortcut="Ctrl+C" onClick={copySelection} />
              <MenuItem label="Traer adelante" shortcut="]" onClick={bringForward} />
              <MenuItem label="Enviar atrás" shortcut="[" onClick={sendBackward} />
              <MenuItem label="Bloquear / desbloquear" onClick={toggleLock} />
              <MenuItem label="Eliminar" shortcut="Supr" danger onClick={deleteSelection} />
            </>
          ) : (
            <>
              <MenuItem label="Pegar" shortcut="Ctrl+V" onClick={paste} />
              <MenuItem label="Centrar contenido" onClick={() => apiRef.current?.fitToContent()} />
              <MenuItem label="Nueva nota" onClick={() => setTool('note')} />
            </>
          )}
        </ul>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={MEDIA_LIMITS.acceptedMime.join(',')}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void onFile(file)
          event.target.value = ''
        }}
      />

      <Modal
        open={dialog !== null}
        title={dialog === 'video' ? 'Insertar video' : dialog === 'link' ? 'Agregar enlace' : 'Imagen por URL'}
        description={
          dialog === 'video'
            ? 'Pegá un link de YouTube, Vimeo o un archivo .mp4. No guardamos el video.'
            : undefined
        }
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={submitDialog} disabled={!dialogValue.trim()}>
              Agregar
            </Button>
          </>
        }
      >
        <Label htmlFor="dialog-url">URL</Label>
        <Input
          id="dialog-url"
          data-autofocus
          value={dialogValue}
          placeholder="https://…"
          onChange={(event) => setDialogValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submitDialog()
          }}
        />
        <div className="mt-4">
          <Label htmlFor="dialog-title">Título</Label>
          <Input
            id="dialog-title"
            value={dialogTitle}
            placeholder="Opcional"
            onChange={(event) => setDialogTitle(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}

function MenuItem({
  label,
  shortcut,
  onClick,
  danger,
}: {
  label: string
  shortcut?: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-between gap-6 px-3 py-1.5 text-left transition-colors hover:bg-[var(--surface-muted)] ${
          danger ? 'text-[var(--danger)]' : ''
        }`}
      >
        {label}
        {shortcut && <span className="text-[11px] text-[var(--text-secondary)]">{shortcut}</span>}
      </button>
    </li>
  )
}

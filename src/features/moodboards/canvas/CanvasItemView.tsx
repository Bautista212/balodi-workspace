import { useState } from 'react'
import { ExternalLink, Link2, Lock, Play } from 'lucide-react'
import { useAssetUrl } from '@/hooks/useAssetUrl'
import { hostnameOf } from '@/lib/media'
import { cn } from '@/lib/utils'
import type { MoodItem } from '@/types'

interface Props {
  item: MoodItem
  selected: boolean
  editing: boolean
  onStartEdit: () => void
  onCommitText: (text: string) => void
}

export function CanvasItemView({ item, selected, editing, onStartEdit, onCommitText }: Props) {
  const src = useAssetUrl(item.assetId, item.src)
  const [draft, setDraft] = useState(item.text ?? '')

  const [wasEditing, setWasEditing] = useState(editing)

  if (editing !== wasEditing) {
    setWasEditing(editing)
    if (editing) {
      setDraft(item.text ?? '')
    }
  }

  const editable = (
    <textarea
      autoFocus
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => onCommitText(draft)}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === 'Escape') onCommitText(draft)
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className="h-full w-full resize-none border-none bg-transparent p-0 outline-none"
      style={{
        fontSize: item.fontSize ?? (item.type === 'text' ? 28 : 18),
        color: item.textColor ?? 'var(--balodi-black)',
        fontFamily: item.type === 'text' ? 'var(--font-display)' : 'var(--font-ui)',
        fontWeight: item.type === 'text' ? 800 : 500,
        lineHeight: 1.25,
      }}
    />
  )

  const body = () => {
    switch (item.type) {
      case 'note':
        return (
          <div
            className="h-full w-full overflow-hidden rounded-[10px] p-4 shadow-[0_2px_10px_-6px_rgba(18,16,16,0.5)]"
            style={{ background: item.color ?? '#ffd66b', color: item.textColor ?? '#121010' }}
            onDoubleClick={onStartEdit}
          >
            {editing ? (
              editable
            ) : (
              <p
                className="whitespace-pre-wrap break-words"
                style={{ fontSize: item.fontSize ?? 18, lineHeight: 1.25 }}
              >
                {item.text}
              </p>
            )}
          </div>
        )
      case 'text':
        return (
          <div className="h-full w-full overflow-hidden" onDoubleClick={onStartEdit}>
            {editing ? (
              editable
            ) : (
              <p
                className="whitespace-pre-wrap break-words"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  fontSize: item.fontSize ?? 28,
                  color: item.textColor ?? 'var(--balodi-black)',
                  lineHeight: 1.1,
                }}
              >
                {item.text}
              </p>
            )}
          </div>
        )
      case 'image':
        return src ? (
          <img
            src={src}
            alt={item.text ?? ''}
            draggable={false}
            className="h-full w-full rounded-[8px] object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-[8px] bg-[var(--surface-sunken)] text-[12px] text-[var(--text-secondary)]">
            Imagen no disponible
          </div>
        )
      case 'link':
        return (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            onPointerDown={(event) => event.stopPropagation()}
            className="flex h-full w-full flex-col justify-between rounded-[10px] border border-[var(--border)] bg-white p-3 no-underline"
          >
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--text-primary)]">
              <Link2 size={13} className="shrink-0" />
              <span className="line-clamp-2">{item.text || item.url}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
              {hostnameOf(item.url ?? '')} <ExternalLink size={10} />
            </span>
          </a>
        )
      case 'video':
        if (item.provider === 'youtube' || item.provider === 'vimeo') {
          return (
            <iframe
              src={item.embedUrl}
              title={item.text ?? 'Video'}
              allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full rounded-[8px] border-0 bg-black"
            />
          )
        }
        if (item.provider === 'file') {
          return (
            <video
              src={item.embedUrl}
              controls
              onPointerDown={(event) => event.stopPropagation()}
              className="h-full w-full rounded-[8px] bg-black"
            />
          )
        }
        return (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            onPointerDown={(event) => event.stopPropagation()}
            className="flex h-full w-full flex-col justify-between rounded-[10px] border border-[var(--border)] bg-white p-3 no-underline"
          >
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--text-primary)]">
              <Play size={13} /> {item.text || 'Video'}
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">{hostnameOf(item.url ?? '')}</span>
          </a>
        )
      case 'rect':
        return <div className="h-full w-full rounded-[8px]" style={{ background: item.color ?? '#fd3a00' }} />
      case 'ellipse':
        return <div className="h-full w-full rounded-full" style={{ background: item.color ?? '#fd3a00' }} />
      case 'line':
        return (
          <div className="flex h-full w-full items-center">
            <div className="h-[3px] w-full rounded-full" style={{ background: item.color ?? '#121010' }} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        'absolute',
        selected && 'outline outline-2 outline-offset-2 outline-[var(--balodi-orange)]',
        item.locked ? 'cursor-not-allowed' : 'cursor-move',
      )}
      style={{ left: item.x, top: item.y, width: item.width, height: item.height, zIndex: item.z }}
      data-item-id={item.id}
    >
      {body()}
      {item.locked && (
        <span className="absolute -right-2 -top-2 rounded-full bg-[var(--balodi-black)] p-1 text-white">
          <Lock size={10} />
        </span>
      )}
    </div>
  )
}

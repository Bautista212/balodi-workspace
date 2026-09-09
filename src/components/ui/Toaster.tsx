import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { useUiStore, type ToastTone } from '@/stores/useUiStore'

const icons: Record<ToastTone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
}

const colors: Record<ToastTone, string> = {
  info: 'var(--text-primary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
}

export function Toaster() {
  const toasts = useUiStore((state) => state.toasts)
  const dismiss = useUiStore((state) => state.dismissToast)

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-[min(92vw,380px)] -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-5 sm:translate-x-0"
      role="status"
      aria-live="polite"
    >
      {toasts.map((item) => {
        const Icon = icons[item.tone]
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => dismiss(item.id)}
            className="pointer-events-auto flex w-full items-start gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left shadow-[var(--shadow-pop)]"
          >
            <Icon size={18} style={{ color: colors[item.tone] }} className="mt-0.5 shrink-0" />
            <span>
              <span className="block text-sm font-semibold">{item.title}</span>
              {item.description && (
                <span className="mt-0.5 block text-[13px] text-[var(--text-secondary)]">{item.description}</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

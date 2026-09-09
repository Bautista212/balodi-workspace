import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Badge({
  children,
  tone = 'muted',
  className,
}: {
  children: ReactNode
  tone?: 'muted' | 'orange' | 'ink' | 'success'
  className?: string
}) {
  const tones = {
    muted: 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)]',
    orange: 'bg-[var(--balodi-orange)] text-white border-transparent',
    ink: 'bg-[var(--balodi-black)] text-white border-transparent',
    success: 'bg-[color-mix(in_srgb,var(--success)_12%,white)] text-[var(--success)] border-transparent',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-[10px] bg-[var(--surface-sunken)]', className)} />
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[16px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] px-6 py-14 text-center">
      {icon && <div className="mb-3 text-[var(--balodi-orange)]">{icon}</div>}
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--balodi-black)] px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity duration-100 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100"
      >
        {label}
      </span>
    </span>
  )
}

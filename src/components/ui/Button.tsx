import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'ink' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 select-none'

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--balodi-orange)] text-white hover:bg-[var(--balodi-orange-strong)] active:bg-[var(--balodi-orange-strong)]',
  ink: 'bg-[var(--balodi-black)] text-white hover:bg-[#2a2523] active:bg-black',
  outline:
    'border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)]',
  ghost: 'text-[var(--text-primary)] hover:bg-[var(--surface-muted)]',
  danger: 'bg-[var(--danger)] text-white hover:brightness-110',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
}

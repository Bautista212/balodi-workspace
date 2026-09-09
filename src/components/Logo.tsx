import { cn } from '@/lib/utils'
import { brand } from '@/config/brand'

/** Marca denominativa propia de Balodi: pastilla naranja + Poppins pesada. */
export function Logo({
  size = 'md',
  variant = 'pill',
  label = brand.company,
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'pill' | 'flat' | 'inverse'
  label?: string
  className?: string
}) {
  const sizes = {
    sm: 'text-[13px] px-2.5 py-1',
    md: 'text-[15px] px-3.5 py-1.5',
    lg: 'text-[19px] px-5 py-2',
  }
  const variants = {
    pill: 'bg-[var(--balodi-orange)] text-white',
    flat: 'text-[var(--balodi-black)]',
    inverse: 'bg-white text-[var(--balodi-black)]',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-black tracking-[-0.04em]',
        sizes[size],
        variants[variant],
        variant === 'flat' && 'px-0',
        className,
      )}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {label}
    </span>
  )
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-[9px] bg-[var(--balodi-orange)] font-black text-white"
      style={{ width: size, height: size, fontFamily: 'var(--font-display)', fontSize: size * 0.6 }}
    >
      B
    </span>
  )
}

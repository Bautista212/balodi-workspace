import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LogoMark } from '@/components/Logo'
import { brand } from '@/config/brand'
import { cn } from '@/lib/utils'

/** Bloque promocional integrado: aparece en pocos lugares y nunca como popup. */
export function BalodiPromo({
  variant = 'dashboard',
  className,
}: {
  variant?: 'dashboard' | 'contextual'
  className?: string
}) {
  const copy = variant === 'dashboard' ? brand.cta.dashboard : brand.cta.contextual
  const body = variant === 'contextual' ? brand.cta.contextual.body : undefined

  return (
    <aside
      className={cn(
        'flex flex-col gap-4 rounded-[16px] border border-[var(--border)] bg-[var(--balodi-black)] p-6 text-white sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <LogoMark size={30} />
        <div>
          <p className="max-w-[46ch] text-[17px] font-bold leading-snug">{copy.title}</p>
          {body && <p className="mt-1 max-w-[52ch] text-[13px] text-white/70">{body}</p>}
        </div>
      </div>
      <a href={brand.links.contact} target="_blank" rel="noreferrer" className="shrink-0">
        <Button icon={<ArrowRight size={16} />}>{copy.button}</Button>
      </a>
    </aside>
  )
}

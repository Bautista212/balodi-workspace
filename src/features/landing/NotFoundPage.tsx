import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Logo'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[var(--surface-muted)] px-6 text-center">
      <Logo size="sm" />
      <p className="display-tight text-[clamp(4rem,18vw,9rem)] text-[var(--balodi-orange)]">404</p>
      <h1 className="text-2xl">Esta página no existe</h1>
      <p className="max-w-sm text-sm text-[var(--text-secondary)]">
        El enlace puede estar mal escrito o el proyecto ya no está. Volvé al inicio y seguimos.
      </p>
      <div className="flex gap-3">
        <Link to="/app">
          <Button>Ir a mi espacio</Button>
        </Link>
        <Link to="/">
          <Button variant="outline">Volver al inicio</Button>
        </Link>
      </div>
    </div>
  )
}

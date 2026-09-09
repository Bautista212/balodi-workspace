import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Misc'
import { Logo } from '@/components/Logo'
import { brand } from '@/config/brand'
import { isLocalMode } from '@/config/env'

function AuthShell({
  title,
  subtitle,
  cta,
  alternate,
}: {
  title: string
  subtitle: string
  cta: string
  alternate: { text: string; label: string; to: string }
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-muted)] px-5 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-block">
          <Logo />
        </Link>
        <div className="mt-6 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-7">
          <h1 className="text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{subtitle}</p>

          <div className="mt-6 space-y-4" aria-describedby="auth-note">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="vos@tuempresa.com" disabled />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" disabled />
            </div>
            <Button className="w-full" disabled>
              {cta}
            </Button>
          </div>

          {isLocalMode && (
            <p id="auth-note" className="mt-3 flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
              <Badge>Próximamente</Badge>
              Las cuentas llegan cuando conectemos el servidor. Mientras tanto, usá la app en este navegador.
            </p>
          )}

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-[12px] font-semibold text-[var(--text-secondary)]">o</span>
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <Link to="/app">
            <Button variant="ink" className="w-full">
              Probar sin registrarme
            </Button>
          </Link>

          <p className="mt-5 text-center text-[13px] text-[var(--text-secondary)]">
            {alternate.text}{' '}
            <Link to={alternate.to} className="font-semibold text-[var(--balodi-orange)]">
              {alternate.label}
            </Link>
          </p>
        </div>
        <p className="mt-5 text-center text-[12px] text-[var(--text-secondary)]">
          {brand.product} · creado por {brand.company}
        </p>
      </div>
    </div>
  )
}

export function LoginPage() {
  return (
    <AuthShell
      title="Entrar"
      subtitle="Tu trabajo te espera. Por ahora vive en este navegador."
      cta="Entrar"
      alternate={{ text: '¿Todavía no tenés cuenta?', label: 'Registrate', to: '/register' }}
    />
  )
}

export function RegisterPage() {
  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Vas a poder llevar tus espacios a cualquier dispositivo."
      cta="Crear cuenta"
      alternate={{ text: '¿Ya tenés cuenta?', label: 'Entrá', to: '/login' }}
    />
  )
}

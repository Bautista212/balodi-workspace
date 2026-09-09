import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Misc'
import { Logo } from '@/components/Logo'
import { brand } from '@/config/brand'

const ready = [
  'Espacios de trabajo: crear, editar y eliminar',
  'Moodboard: notas, textos, imágenes, enlaces, videos y formas',
  'Tablero: columnas, tareas, prioridades, etiquetas y fechas',
  'Guardado automático en este navegador',
  'Backup: exportar e importar JSON',
]

const next = [
  'Cuentas y sincronización en la nube',
  'Invitar a tu equipo con permisos',
  'Comentarios y presencia en tiempo real',
  'Plantillas para emprendedores',
]

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Link to="/" className="inline-block">
        <Logo size="sm" />
      </Link>
      <h1 className="mt-6 text-[clamp(2rem,5vw,3rem)]">Sobre la herramienta</h1>
      <p className="mt-4 text-[16px] leading-relaxed text-[var(--text-secondary)]">
        {brand.product} junta dos cosas que en la práctica van siempre de la mano: el lugar donde pensás una idea y el
        lugar donde la convertís en tareas. Es gratis y está en beta.
      </p>
      <p className="mt-3 text-[16px] leading-relaxed text-[var(--text-secondary)]">
        {brand.about.body}
      </p>

      <div className="mt-9 grid gap-6 sm:grid-cols-2">
        <section>
          <h2 className="text-lg">Ya funciona</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
            {ready.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--success)]" />
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-lg">En camino</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
            {next.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--border-strong)]" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-10 rounded-[16px] border border-[var(--border)] bg-[var(--surface-muted)] p-6">
        <Badge tone="orange">{brand.version}</Badge>
        <p className="mt-3 text-lg font-bold">{brand.cta.contextual.title}</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{brand.cta.contextual.body}</p>
        <a href={brand.links.contact} target="_blank" rel="noreferrer" className="mt-4 inline-block">
          <Button icon={<ArrowRight size={16} />}>{brand.cta.contextual.button}</Button>
        </a>
      </div>

      <div className="mt-8 flex gap-3">
        <Link to="/app">
          <Button variant="outline">Ir a la herramienta</Button>
        </Link>
        <Link to="/">
          <Button variant="ghost">Volver al inicio</Button>
        </Link>
      </div>
    </div>
  )
}

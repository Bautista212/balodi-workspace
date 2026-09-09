import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Layers, Menu, SquareKanban, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Logo'
import { PhotoSlot } from '@/components/PhotoSlot'
import { brand } from '@/config/brand'
import { ProductPeek } from './ProductPeek'

const navLinks = [
  { label: 'Producto', href: '#producto' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Sobre Balodi', href: '#balodi' },
]

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--balodi-black)] focus:px-3 focus:py-2 focus:text-white"
      >
        Ir al contenido
      </a>

      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3" aria-label="Principal">
          <Link to="/" className="shrink-0">
            <Logo size="md" />
          </Link>
          <div className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link to="/app" className="hidden sm:block">
              <Button size="sm">Entrar gratis</Button>
            </Link>
            <button
              type="button"
              className="rounded-md p-2 md:hidden"
              aria-expanded={menuOpen}
              aria-label="Abrir menú"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
        {menuOpen && (
          <div className="border-t border-[var(--border)] px-5 py-3 md:hidden">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-semibold"
                >
                  {link.label}
                </a>
              ))}
              <Link to="/app" onClick={() => setMenuOpen(false)}>
                <Button className="w-full">Entrar gratis</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ------------------------------- HERO ------------------------------- */}
      <section id="hero" className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--balodi-orange)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              Gratis. Sin tarjeta. Sin vueltas.
            </span>
            <h1 className="display-tight mt-5 text-[clamp(2.6rem,7vw,4.6rem)]">
              Tus ideas, tus tareas y tu próximo gran proyecto. Todo en un mismo lugar.
            </h1>
            <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-[var(--text-secondary)]">
              Organizá el trabajo, armá moodboards y convertí el caos creativo en un plan que realmente avance.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/app/moodboards">
                <Button size="lg" icon={<Layers size={18} />}>
                  Abrir moodboard
                </Button>
              </Link>
              <Link to="/app/boards">
                <Button size="lg" variant="ink" icon={<SquareKanban size={18} />}>
                  Abrir tablero
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10">
              <ProductPeek />
            </div>
            <div className="pointer-events-none absolute -left-2 -top-8 z-20 hidden w-32 rotate-[-7deg] border-[6px] border-white bg-white shadow-[0_18px_40px_-24px_rgba(18,16,16,0.6)] sm:block">
              <PhotoSlot src={brand.media.hero} scene="ola" ratio="3 / 4" />
            </div>
            <div className="pointer-events-none absolute -bottom-10 -right-2 z-20 hidden w-40 rotate-[6deg] border-[6px] border-white bg-white shadow-[0_18px_40px_-24px_rgba(18,16,16,0.6)] sm:block">
              <PhotoSlot scene="ruta" ratio="4 / 3" />
            </div>
            <svg
              aria-hidden
              viewBox="0 0 120 60"
              className="absolute -top-10 right-10 hidden w-24 text-[var(--balodi-orange)] lg:block"
            >
              <path
                d="M4 46C30 8 74 4 112 18"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
              <path d="M112 18l-16-2 10 12z" fill="currentColor" />
            </svg>
          </div>
        </div>
      </section>

      {/* --------------------------- CÓMO FUNCIONA -------------------------- */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
        <div id="producto" className="grid gap-6 md:grid-cols-2">
          <article className="flex flex-col justify-between rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-7">
            <div>
              <Layers size={26} className="text-[var(--balodi-orange)]" />
              <h2 className="mt-4 text-[clamp(1.7rem,3.4vw,2.4rem)]">Pensalo visualmente</h2>
              <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[var(--text-secondary)]">
                Reuní imágenes, notas, enlaces, videos e ideas en una pizarra infinita.
              </p>
            </div>
            <div className="mt-7">
              <Link to="/app/moodboards">
                <Button icon={<ArrowRight size={16} />}>Crear moodboard</Button>
              </Link>
            </div>
          </article>

          <article className="flex flex-col justify-between rounded-[18px] border border-[var(--border)] bg-[var(--balodi-black)] p-7 text-white">
            <div>
              <SquareKanban size={26} className="text-[var(--balodi-orange)]" />
              <h2 className="mt-4 text-[clamp(1.7rem,3.4vw,2.4rem)] text-white">Convertí ideas en acción</h2>
              <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-white/70">
                Organizá tareas, responsables y etapas en un tablero simple y flexible.
              </p>
            </div>
            <div className="mt-7">
              <Link to="/app/boards">
                <Button icon={<ArrowRight size={16} />}>Crear tablero</Button>
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* ------------------------------ BALODI ------------------------------ */}
      <section id="balodi" className="border-y border-[var(--border)] bg-[var(--surface-muted)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
          <div className="flex gap-4">
            <div className="w-1/2 rotate-[-4deg] border-[8px] border-white bg-white shadow-[0_20px_44px_-28px_rgba(18,16,16,0.7)]">
              <PhotoSlot src={brand.media.aboutLeft} scene="taller" ratio="3 / 4" />
            </div>
            <div className="mt-10 w-1/2 rotate-[4deg] border-[8px] border-white bg-white shadow-[0_20px_44px_-28px_rgba(18,16,16,0.7)]">
              <PhotoSlot src={brand.media.aboutRight} scene="horizonte" ratio="3 / 4" />
            </div>
          </div>
          <div>
            <h2 className="display-tight text-[clamp(2.2rem,5vw,3.4rem)]">{brand.about.origin}</h2>
            <p className="mt-5 max-w-[54ch] text-[17px] leading-relaxed text-[var(--text-secondary)]">
              {brand.about.body}
            </p>
            <div className="mt-8 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6">
              <p className="text-lg font-bold">{brand.cta.landing.title}</p>
              <a href={brand.links.contact} target="_blank" rel="noreferrer" className="mt-4 inline-block">
                <Button size="lg" icon={<ArrowRight size={18} />}>
                  {brand.cta.landing.button}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo size="sm" />
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Creado por {brand.company}. {brand.product} está en beta: puede cambiar y romperse de a ratos.
            </p>
          </div>
          <nav aria-label="Enlaces de Balodi" className="flex flex-wrap items-center gap-5 text-sm font-semibold">
            <a href={brand.links.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href={brand.links.website} target="_blank" rel="noreferrer">
              Sitio web
            </a>
            <a href={brand.links.contact} target="_blank" rel="noreferrer">
              Contacto
            </a>
            <Link to="/about">Sobre la herramienta</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

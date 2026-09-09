import { cn } from '@/lib/utils'

/**
 * Espacio para fotografia editorial.
 * Si brand.media trae una URL se usa la foto real; si no, se dibuja una
 * composicion propia (sin imagenes de terceros) con la paleta analogica.
 */
const scenes = {
  horizonte: (
    <>
      <rect width="400" height="300" fill="#eec9a3" />
      <rect y="0" width="400" height="150" fill="#f3d6ae" />
      <circle cx="286" cy="118" r="46" fill="#fd3a00" opacity="0.9" />
      <rect y="150" width="400" height="150" fill="#1d5877" />
      <path d="M0 196h400v6H0zM0 214h400v4H0zM0 236h400v3H0z" fill="#ffffff" opacity="0.28" />
      <path d="M96 150l26-46 24 46z" fill="#123f57" />
    </>
  ),
  ruta: (
    <>
      <rect width="400" height="300" fill="#dfe7ea" />
      <rect y="140" width="400" height="160" fill="#3b3835" />
      <path d="M186 300l14-160h4l14 160z" fill="#f4f1ea" />
      <rect y="112" width="400" height="30" fill="#c9b191" />
      <circle cx="330" cy="72" r="34" fill="#fd3a00" opacity="0.85" />
      <path d="M52 140c0-26 16-44 38-44s38 18 38 44z" fill="#1d5877" />
    </>
  ),
  ola: (
    <>
      <rect width="400" height="300" fill="#123f57" />
      <path d="M0 178c62-44 116-14 170 4 56 18 116 22 230-26v144H0z" fill="#1d5877" />
      <path d="M0 226c74-32 132-6 196 12s134 12 204-22v84H0z" fill="#2d7ea3" />
      <path d="M0 62h400v58H0z" fill="#f3d6ae" opacity="0.35" />
      <circle cx="88" cy="72" r="26" fill="#fd3a00" />
    </>
  ),
  taller: (
    <>
      <rect width="400" height="300" fill="#f2efe9" />
      <rect x="34" y="40" width="150" height="200" rx="4" fill="#fd3a00" />
      <rect x="200" y="66" width="164" height="88" rx="4" fill="#1d5877" />
      <rect x="200" y="170" width="164" height="70" rx="4" fill="#121010" />
      <rect x="60" y="72" width="98" height="10" fill="#ffffff" opacity="0.85" />
      <rect x="60" y="94" width="70" height="10" fill="#ffffff" opacity="0.6" />
    </>
  ),
}

export type SceneName = keyof typeof scenes

export function PhotoSlot({
  src,
  scene = 'horizonte',
  alt = '',
  className,
  ratio = '4 / 5',
}: {
  src?: string
  scene?: SceneName
  alt?: string
  className?: string
  ratio?: string
}) {
  return (
    <div
      className={cn('grain relative overflow-hidden bg-[var(--surface-sunken)]', className)}
      style={{ aspectRatio: ratio }}
    >
      {src ? (
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <svg
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
          role="img"
          aria-label={alt || 'Composición gráfica de Balodi'}
        >
          {scenes[scene]}
        </svg>
      )}
    </div>
  )
}

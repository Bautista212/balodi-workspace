/** Limites configurables para archivos locales. */
export const MEDIA_LIMITS = {
  maxUploadBytes: 8 * 1024 * 1024, // aviso al usuario por encima de esto
  maxStoredEdge: 1600, // el lado mayor se reduce a este valor antes de persistir
  thumbnailEdge: 320,
  acceptedMime: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
}

export interface ProcessedImage {
  blob: Blob
  width: number
  height: number
  thumbnail: string
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo leer la imagen'))
    img.src = src
  })
}

/** Redimensiona y comprime antes de guardar: menos IndexedDB hoy, menos Storage manana. */
export async function processImageFile(file: File): Promise<ProcessedImage> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    const scale = Math.min(1, MEDIA_LIMITS.maxStoredEdge / Math.max(image.width, image.height))
    const width = Math.round(image.width * scale)
    const height = Math.round(image.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas no disponible')
    ctx.drawImage(image, 0, 0, width, height)

    const mime = file.type === 'image/png' || file.type === 'image/gif' ? 'image/png' : 'image/jpeg'
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mime, 0.85),
    )

    const thumbScale = Math.min(1, MEDIA_LIMITS.thumbnailEdge / Math.max(width, height))
    const thumbCanvas = document.createElement('canvas')
    thumbCanvas.width = Math.round(width * thumbScale)
    thumbCanvas.height = Math.round(height * thumbScale)
    thumbCanvas.getContext('2d')?.drawImage(image, 0, 0, thumbCanvas.width, thumbCanvas.height)

    return {
      blob: blob ?? file,
      width,
      height,
      thumbnail: thumbCanvas.toDataURL('image/jpeg', 0.6),
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export interface EmbedInfo {
  provider: 'youtube' | 'vimeo' | 'file' | 'link'
  embedUrl: string
  title: string
}

/** Normaliza una URL de video a algo embebible. Nunca descarga ni almacena el video. */
export function resolveEmbed(rawUrl: string): EmbedInfo | null {
  const value = rawUrl.trim()
  if (!value) return null
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }
  const host = url.hostname.replace(/^www\./, '')

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const id = url.searchParams.get('v') ?? url.pathname.split('/').pop()
    if (id) return { provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${id}`, title: 'YouTube' }
  }
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1)
    if (id) return { provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${id}`, title: 'YouTube' }
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean).pop()
    if (id && /^\d+$/.test(id)) {
      return { provider: 'vimeo', embedUrl: `https://player.vimeo.com/video/${id}`, title: 'Vimeo' }
    }
  }
  if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) {
    return { provider: 'file', embedUrl: url.href, title: url.pathname.split('/').pop() ?? 'Video' }
  }
  // Fallback: tarjeta de enlace.
  return { provider: 'link', embedUrl: url.href, title: host }
}

export function hostnameOf(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '')
  } catch {
    return rawUrl
  }
}

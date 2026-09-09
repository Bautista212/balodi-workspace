import type { MoodItem } from '@/types'

const PADDING = 48

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  let line = ''
  let cursorY = y
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY)
      line = word
      cursorY += lineHeight
    } else {
      line = candidate
    }
  }
  if (line) ctx.fillText(line, x, cursorY)
}

/**
 * Rasteriza el moodboard a PNG. Los videos y enlaces se dibujan como tarjeta
 * (no se descarga contenido externo).
 */
export async function exportMoodboardPng(
  items: MoodItem[],
  resolveImage: (item: MoodItem) => Promise<HTMLImageElement | null>,
  scale = 2,
): Promise<Blob | null> {
  if (items.length === 0) return null

  const minX = Math.min(...items.map((item) => item.x)) - PADDING
  const minY = Math.min(...items.map((item) => item.y)) - PADDING
  const maxX = Math.max(...items.map((item) => item.x + item.width)) + PADDING
  const maxY = Math.max(...items.map((item) => item.y + item.height)) + PADDING

  const canvas = document.createElement('canvas')
  canvas.width = Math.round((maxX - minX) * scale)
  canvas.height = Math.round((maxY - minY) * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.scale(scale, scale)
  ctx.translate(-minX, -minY)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(minX, minY, maxX - minX, maxY - minY)

  const ordered = [...items].sort((a, b) => a.z - b.z)

  for (const item of ordered) {
    const { x, y, width, height } = item
    switch (item.type) {
      case 'note': {
        ctx.fillStyle = item.color ?? '#ffd66b'
        roundedRect(ctx, x, y, width, height, 10)
        ctx.fill()
        ctx.fillStyle = item.textColor ?? '#121010'
        ctx.font = `500 ${item.fontSize ?? 18}px Inter, sans-serif`
        ctx.textBaseline = 'top'
        wrapText(ctx, item.text ?? '', x + 16, y + 16, width - 32, (item.fontSize ?? 18) * 1.35)
        break
      }
      case 'text': {
        ctx.fillStyle = item.textColor ?? '#121010'
        ctx.font = `700 ${item.fontSize ?? 28}px Poppins, Inter, sans-serif`
        ctx.textBaseline = 'top'
        wrapText(ctx, item.text ?? '', x, y, width, (item.fontSize ?? 28) * 1.2)
        break
      }
      case 'rect': {
        ctx.fillStyle = item.color ?? '#fd3a00'
        roundedRect(ctx, x, y, width, height, 8)
        ctx.fill()
        break
      }
      case 'ellipse': {
        ctx.fillStyle = item.color ?? '#fd3a00'
        ctx.beginPath()
        ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
        ctx.fill()
        break
      }
      case 'line': {
        ctx.strokeStyle = item.color ?? '#121010'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(x, y + height / 2)
        ctx.lineTo(x + width, y + height / 2)
        ctx.stroke()
        break
      }
      case 'image': {
        const image = await resolveImage(item)
        if (image) {
          ctx.drawImage(image, x, y, width, height)
        } else {
          ctx.fillStyle = '#ecebe8'
          roundedRect(ctx, x, y, width, height, 8)
          ctx.fill()
        }
        break
      }
      case 'link':
      case 'video': {
        ctx.fillStyle = '#ffffff'
        roundedRect(ctx, x, y, width, height, 10)
        ctx.fill()
        ctx.strokeStyle = '#e2e0dc'
        ctx.lineWidth = 1
        roundedRect(ctx, x, y, width, height, 10)
        ctx.stroke()
        ctx.fillStyle = '#121010'
        ctx.font = '600 15px Inter, sans-serif'
        ctx.textBaseline = 'top'
        wrapText(ctx, item.text || item.url || '', x + 14, y + 14, width - 28, 20)
        ctx.fillStyle = '#6b6663'
        ctx.font = '400 12px Inter, sans-serif'
        ctx.fillText(item.type === 'video' ? 'Video' : 'Enlace', x + 14, y + height - 26)
        break
      }
      default:
        break
    }
  }

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

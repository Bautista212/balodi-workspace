export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

/** IDs estables tipo UUID v4 (con fallback para navegadores sin crypto.randomUUID). */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function now(): string {
  return new Date().toISOString()
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  const debounced = (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, wait)
  }
  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }
  debounced.flush = (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = null
    fn(...args)
  }
  return debounced
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Posicion fraccional: evita reescribir toda la columna al reordenar. */
export function positionBetween(before?: number, after?: number): number {
  if (before === undefined && after === undefined) return 1000
  if (before === undefined) return (after as number) - 1000
  if (after === undefined) return before + 1000
  return (before + after) / 2
}

export function formatDate(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

export function relativeDay(value?: string | null): 'overdue' | 'today' | 'soon' | 'later' | null {
  if (!value) return null
  const due = new Date(value)
  if (Number.isNaN(due.getTime())) return null
  const today = new Date()
  const diff = Math.floor(
    (Date.UTC(due.getFullYear(), due.getMonth(), due.getDate()) -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
      86400000,
  )
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff <= 3) return 'soon'
  return 'later'
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

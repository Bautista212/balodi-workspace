import 'fake-indexeddb/auto'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom no implementa estas APIs del navegador que usan el canvas y dnd-kit.
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:mock')
  URL.revokeObjectURL = vi.fn()
}

if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn(() => false)
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})

import { create } from 'zustand'
import { uid } from '@/lib/utils'

export type ToastTone = 'info' | 'success' | 'warning' | 'danger'

export interface Toast {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

interface UiState {
  sidebarCollapsed: boolean
  toasts: Toast[]
  toggleSidebar: () => void
  setSidebar: (collapsed: boolean) => void
  toast: (input: { title: string; description?: string; tone?: ToastTone }) => void
  dismissToast: (id: string) => void
}

const SIDEBAR_KEY = 'balodi:sidebar-collapsed'

export const useUiStore = create<UiState>((set, get) => ({
  sidebarCollapsed:
    typeof localStorage !== 'undefined' && localStorage.getItem(SIDEBAR_KEY) === '1',
  toasts: [],
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed
    localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0')
    set({ sidebarCollapsed: next })
  },
  setSidebar: (collapsed) => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
    set({ sidebarCollapsed: collapsed })
  },
  toast: ({ title, description, tone = 'info' }) => {
    const id = uid()
    set((state) => ({ toasts: [...state.toasts, { id, title, description, tone }] }))
    setTimeout(() => get().dismissToast(id), 4200)
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))

export const toast = (input: { title: string; description?: string; tone?: ToastTone }) =>
  useUiStore.getState().toast(input)

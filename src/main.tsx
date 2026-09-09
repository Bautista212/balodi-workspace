import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from '@/components/ui/Toaster'
import { router } from '@/app/router'
import '@/styles/index.css'

const container = document.getElementById('root')
if (!container) throw new Error('No se encontró el nodo raíz #root')

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster />
    </ErrorBoundary>
  </StrictMode>,
)

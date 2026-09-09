/* eslint-disable react-refresh/only-export-components -- archivo de rutas: exporta la definición y los fallbacks, no componentes de página. */
import { Suspense, lazy } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { Skeleton } from '@/components/ui/Misc'
import { LandingPage } from '@/features/landing/LandingPage'
import { AboutPage } from '@/features/landing/AboutPage'
import { NotFoundPage } from '@/features/landing/NotFoundPage'
import { LoginPage, RegisterPage } from '@/features/auth/AuthPages'
import { DashboardPage } from '@/features/workspaces/DashboardPage'
import { MoodboardsPage } from '@/features/moodboards/MoodboardsPage'

import { BoardsPage } from '@/features/boards/BoardsPage'

// Los dos editores son las pantallas mas pesadas: se cargan bajo demanda.
const MoodboardEditorPage = lazy(() =>
  import('@/features/moodboards/MoodboardEditorPage').then((module) => ({ default: module.MoodboardEditorPage })),
)
const BoardPage = lazy(() => import('@/features/boards/BoardPage').then((module) => ({ default: module.BoardPage })))

function EditorFallback() {
  return (
    <div className="px-5 py-8">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-5 h-[60vh] w-full" />
    </div>
  )
}

export const routes: RouteObject[] = [
  { path: '/', element: <LandingPage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'moodboards', element: <MoodboardsPage /> },
      {
        path: 'moodboards/:moodboardId',
        element: (
          <Suspense fallback={<EditorFallback />}>
            <MoodboardEditorPage />
          </Suspense>
        ),
      },
      { path: 'boards', element: <BoardsPage /> },
      {
        path: 'boards/:boardId',
        element: (
          <Suspense fallback={<EditorFallback />}>
            <BoardPage />
          </Suspense>
        ),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]

export const router = createBrowserRouter(routes)

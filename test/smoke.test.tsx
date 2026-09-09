import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { routes } from '@/app/router'
import { repository } from '@/repositories'
import { db } from '@/lib/db'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

async function seed() {
  await repository.maintenance.resetDemo()
  const workspaces = await repository.workspaces.list()
  const boards = await repository.boards.listByWorkspace(workspaces[0].id)
  const moodboards = await repository.moodboards.listByWorkspace(workspaces[0].id)
  return { workspace: workspaces[0], board: boards[0], moodboard: moodboards[0] }
}

describe('rutas públicas', () => {
  it('la landing muestra el título y los dos accesos al producto', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Tus ideas, tus tareas/i)
    expect(screen.getByRole('link', { name: /Abrir moodboard/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Abrir tablero/i })).toBeTruthy()
  })

  it('una ruta inexistente muestra el 404 diseñado', () => {
    renderAt('/no-existe')
    expect(screen.getByRole('heading', { name: /Esta página no existe/i })).toBeTruthy()
  })

  it('el acceso ofrece probar sin registrarse en modo local', () => {
    renderAt('/login')
    expect(screen.getByRole('link', { name: /Probar sin registrarme/i })).toBeTruthy()
  })
})

describe('producto', () => {
  beforeEach(async () => {
    await repository.maintenance.wipe()
  })

  it('siembra la demo y muestra los proyectos recientes en el dashboard', async () => {
    renderAt('/app')
    expect(await screen.findByText('Lanzamiento de campaña', {}, { timeout: 4000 })).toBeTruthy()
    expect(screen.getByText('Identidad de marca')).toBeTruthy()
    expect(screen.getAllByText(/Modo local/i).length).toBeGreaterThan(0)
  })

  it('abre el tablero con sus columnas y tareas y persiste una tarea nueva', async () => {
    const { board } = await seed()
    renderAt(`/app/boards/${board.id}`)

    expect(await screen.findByRole('heading', { name: 'Lanzamiento de campaña' }, { timeout: 4000 })).toBeTruthy()
    for (const title of ['Ideas', 'Por hacer', 'En proceso', 'En revisión', 'Listo']) {
      expect(screen.getByRole('region', { name: title })).toBeTruthy()
    }
    expect(screen.getByText('Definir concepto')).toBeTruthy()

    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: /Agregar tarea/i })[0])
    await user.type(screen.getByPlaceholderText('Título de la tarea'), 'Probar el guardado')
    await user.click(screen.getByRole('button', { name: 'Agregar' }))

    expect(await screen.findByText('Probar el guardado')).toBeTruthy()
    await waitFor(
      async () => {
        const stored = await db.tasks.where('board_id').equals(board.id).toArray()
        expect(stored.some((task) => task.title === 'Probar el guardado')).toBe(true)
      },
      { timeout: 4000 },
    )
  })

  it('abre el moodboard con los elementos de ejemplo', async () => {
    const { moodboard } = await seed()
    renderAt(`/app/moodboards/${moodboard.id}`)

    expect(await screen.findByText('Referencias visuales', {}, { timeout: 4000 })).toBeTruthy()
    expect(screen.getByText('¿Qué queremos que sienta la gente?')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Seleccionar/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Centrar contenido/i })).toBeTruthy()
  })

  it('el backup exporta e importa el estado local', async () => {
    const { board } = await seed()
    const backup = await repository.maintenance.exportBackup()
    expect(backup.boards.some((item) => item.id === board.id)).toBe(true)

    await repository.maintenance.wipe()
    expect(await db.boards.count()).toBe(0)

    await repository.maintenance.importBackup(backup)
    expect(await db.boards.count()).toBe(1)
    expect(await db.tasks.count()).toBe(6)
  })
})

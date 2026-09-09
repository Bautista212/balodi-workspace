import { now, uid } from '@/lib/utils'
import type { Board, Column, Moodboard, Task, Workspace } from '@/types'

export const LOCAL_OWNER_ID = 'local-user'

export const STARTER_COLUMNS: Array<{ title: string; color: string }> = [
  { title: 'Ideas', color: '#8b7cf6' },
  { title: 'Por hacer', color: '#fd3a00' },
  { title: 'En proceso', color: '#2f80ed' },
  { title: 'En revisión', color: '#b7791f' },
  { title: 'Listo', color: '#17845a' },
]

export interface DemoData {
  workspaces: Workspace[]
  boards: Board[]
  columns: Column[]
  tasks: Task[]
  moodboards: Moodboard[]
}

/** Todo el contenido de demostracion vive aca: se crea y se borra en un solo lugar. */
export function buildDemoData(): DemoData {
  const ts = now()
  const workspaceId = uid()
  const boardId = uid()
  const moodboardId = uid()

  const workspace: Workspace = {
    id: workspaceId,
    owner_id: LOCAL_OWNER_ID,
    name: 'Mi negocio',
    description: 'Espacio de ejemplo. Podés renombrarlo o borrarlo cuando quieras.',
    cover_url: null,
    created_at: ts,
    updated_at: ts,
  }

  const columns: Column[] = STARTER_COLUMNS.map((column, index) => ({
    id: uid(),
    board_id: boardId,
    title: column.title,
    color: column.color,
    position: (index + 1) * 1000,
    created_at: ts,
    updated_at: ts,
  }))

  const taskSeed: Array<{
    title: string
    description: string
    column: number
    priority: Task['priority']
    labels: string[]
    due?: number
  }> = [
    { title: 'Definir concepto', description: 'Idea madre de la campaña y mensaje central.', column: 0, priority: 'high', labels: ['Estrategia'] },
    { title: 'Preparar guiones', description: 'Tres guiones cortos para reels.', column: 1, priority: 'medium', labels: ['Contenido'], due: 3 },
    { title: 'Grabar contenido', description: 'Jornada de grabación con el equipo.', column: 1, priority: 'high', labels: ['Producción'], due: 7 },
    { title: 'Editar piezas', description: 'Montaje, subtítulos y placas finales.', column: 2, priority: 'medium', labels: ['Producción'] },
    { title: 'Configurar campaña', description: 'Públicos, presupuesto y creatividades en el administrador.', column: 3, priority: 'urgent', labels: ['Pauta'], due: 1 },
    { title: 'Analizar resultados', description: 'Costo por resultado, mejores piezas y aprendizajes.', column: 4, priority: 'low', labels: ['Datos'] },
  ]

  const labelColors: Record<string, string> = {
    Estrategia: '#fd3a00',
    Contenido: '#2f80ed',
    Producción: '#8b7cf6',
    Pauta: '#b7791f',
    Datos: '#17845a',
  }

  const tasks: Task[] = taskSeed.map((seed, index) => {
    const taskId = uid()
    return {
      id: taskId,
      board_id: boardId,
      column_id: columns[seed.column].id,
      title: seed.title,
      description: seed.description,
      position: (index + 1) * 1000,
      priority: seed.priority,
      due_date: seed.due ? new Date(Date.now() + seed.due * 86400000).toISOString().slice(0, 10) : null,
      cover_url: null,
      created_at: ts,
      updated_at: ts,
      labels: seed.labels.map((label) => ({
        id: uid(),
        task_id: taskId,
        label,
        color: labelColors[label] ?? '#6b6663',
      })),
    }
  })

  const board: Board = {
    id: boardId,
    workspace_id: workspaceId,
    name: 'Lanzamiento de campaña',
    description: 'Del concepto a los resultados, paso por paso.',
    created_at: ts,
    updated_at: ts,
    version: 1,
  }

  const moodboard: Moodboard = {
    id: moodboardId,
    workspace_id: workspaceId,
    name: 'Identidad de marca',
    viewport_data: { x: 0, y: 0, scale: 1 },
    version: 1,
    created_at: ts,
    updated_at: ts,
    document_data: {
      items: [
        {
          id: uid(),
          type: 'text',
          x: 80,
          y: 60,
          width: 460,
          height: 70,
          z: 1,
          locked: false,
          text: 'Referencias visuales',
          fontSize: 44,
          textColor: '#121010',
        },
        {
          id: uid(),
          type: 'note',
          x: 80,
          y: 170,
          width: 240,
          height: 200,
          z: 2,
          locked: false,
          text: '¿Qué queremos que sienta la gente?',
          color: '#ffd66b',
          textColor: '#121010',
          fontSize: 18,
        },
        {
          id: uid(),
          type: 'note',
          x: 350,
          y: 170,
          width: 240,
          height: 200,
          z: 3,
          locked: false,
          text: 'Paleta: naranja fuerte, negro profundo, mucho blanco.',
          color: '#ffb4a0',
          textColor: '#121010',
          fontSize: 18,
        },
        {
          id: uid(),
          type: 'rect',
          x: 620,
          y: 170,
          width: 260,
          height: 200,
          z: 4,
          locked: false,
          color: '#fd3a00',
        },
        {
          id: uid(),
          type: 'link',
          x: 620,
          y: 400,
          width: 300,
          height: 96,
          z: 5,
          locked: false,
          text: 'Guía de estilo de Balodi',
          url: 'https://balodi.example',
        },
      ],
    },
  }

  return {
    workspaces: [workspace],
    boards: [board],
    columns,
    tasks,
    moodboards: [moodboard],
  }
}

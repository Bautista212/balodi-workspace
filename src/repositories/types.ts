import type {
  Asset,
  BackupFile,
  Board,
  BoardBundle,
  Column,
  Moodboard,
  MoodboardDocument,
  Task,
  Viewport,
  Workspace,
} from '@/types'

export interface Page {
  limit?: number
  offset?: number
}

export interface WorkspaceRepository {
  list(page?: Page): Promise<Workspace[]>
  get(id: string): Promise<Workspace | undefined>
  create(input: { name: string; description?: string }): Promise<Workspace>
  update(id: string, patch: Partial<Pick<Workspace, 'name' | 'description' | 'cover_url'>>): Promise<Workspace>
  remove(id: string): Promise<void>
}

export interface BoardRepository {
  listByWorkspace(workspaceId: string, page?: Page): Promise<Board[]>
  /** Trae board + columnas + tareas en una sola consulta acotada al board. */
  getBundle(boardId: string): Promise<BoardBundle | undefined>
  create(input: { workspace_id: string; name: string; withStarterColumns?: boolean }): Promise<Board>
  update(id: string, patch: Partial<Pick<Board, 'name' | 'description'>>): Promise<Board>
  remove(id: string): Promise<void>
  /** Persistencia por lote: la UI llama esto con debounce, nunca por cada frame. */
  saveColumns(boardId: string, columns: Column[]): Promise<void>
  saveTasks(boardId: string, tasks: Task[]): Promise<void>
  deleteColumn(boardId: string, columnId: string): Promise<void>
  deleteTask(taskId: string): Promise<void>
}

export interface MoodboardRepository {
  listByWorkspace(workspaceId: string, page?: Page): Promise<Moodboard[]>
  get(id: string): Promise<Moodboard | undefined>
  create(input: { workspace_id: string; name: string; seed?: MoodboardDocument }): Promise<Moodboard>
  rename(id: string, name: string): Promise<void>
  remove(id: string): Promise<void>
  /** Snapshot con debounce: documento liviano, los binarios viven en assets. */
  saveSnapshot(id: string, snapshot: { document: MoodboardDocument; viewport: Viewport; version: number }): Promise<void>
  putImageAsset(input: {
    workspaceId: string
    moodboardId: string
    name: string
    blob: Blob
    width: number
    height: number
    thumbnail: string
  }): Promise<Asset>
  getImageUrl(assetId: string): Promise<string | null>
  listAssets(workspaceId: string): Promise<Asset[]>
}

export interface MaintenanceRepository {
  exportBackup(): Promise<BackupFile>
  importBackup(file: BackupFile): Promise<void>
  resetDemo(): Promise<void>
  wipe(): Promise<void>
  ensureSeed(): Promise<void>
}

export interface DataRepository {
  readonly kind: 'local' | 'supabase'
  workspaces: WorkspaceRepository
  boards: BoardRepository
  moodboards: MoodboardRepository
  maintenance: MaintenanceRepository
}

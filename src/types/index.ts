/** Modelo de datos compartido por el modo local (IndexedDB) y la fase Supabase. */

export type ISODate = string
export type UUID = string

export interface Profile {
  id: UUID
  full_name: string
  avatar_url: string | null
  created_at: ISODate
  updated_at: ISODate
}

export interface Workspace {
  id: UUID
  owner_id: UUID
  name: string
  description: string
  cover_url: string | null
  created_at: ISODate
  updated_at: ISODate
}

export type WorkspaceRole = 'owner' | 'editor' | 'viewer'

export interface WorkspaceMember {
  workspace_id: UUID
  user_id: UUID
  role: WorkspaceRole
  created_at: ISODate
}

export interface Board {
  id: UUID
  workspace_id: UUID
  name: string
  description: string
  created_at: ISODate
  updated_at: ISODate
  version: number
}

export interface Column {
  id: UUID
  board_id: UUID
  title: string
  color: string
  position: number
  created_at: ISODate
  updated_at: ISODate
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TaskLabel {
  id: UUID
  task_id: UUID
  label: string
  color: string
}

export interface Task {
  id: UUID
  board_id: UUID
  column_id: UUID
  title: string
  description: string
  position: number
  priority: TaskPriority
  due_date: ISODate | null
  cover_url: string | null
  created_at: ISODate
  updated_at: ISODate
  labels: TaskLabel[]
}

export interface BoardBundle {
  board: Board
  columns: Column[]
  tasks: Task[]
}

/* ---------------------------------- Moodboard --------------------------- */

export type MoodItemType =
  | 'note'
  | 'text'
  | 'image'
  | 'link'
  | 'video'
  | 'rect'
  | 'ellipse'
  | 'line'

export interface MoodItem {
  id: UUID
  type: MoodItemType
  x: number
  y: number
  width: number
  height: number
  z: number
  locked: boolean
  /** Texto de notas, textos, titulo de enlaces/videos. */
  text?: string
  /** Relleno de notas y formas. */
  color?: string
  textColor?: string
  fontSize?: number
  /** Imagenes: id del asset local (Blob en IndexedDB) o url externa. */
  assetId?: UUID
  src?: string
  /** Enlaces y videos. */
  url?: string
  /** Video: url de embed ya normalizada. */
  embedUrl?: string
  provider?: 'youtube' | 'vimeo' | 'file' | 'link'
}

export interface Viewport {
  x: number
  y: number
  scale: number
}

export interface MoodboardDocument {
  items: MoodItem[]
}

export interface Moodboard {
  id: UUID
  workspace_id: UUID
  name: string
  viewport_data: Viewport
  document_data: MoodboardDocument
  version: number
  created_at: ISODate
  updated_at: ISODate
}

export type AssetType = 'image' | 'video' | 'link' | 'file'

export interface Asset {
  id: UUID
  workspace_id: UUID
  moodboard_id: UUID | null
  type: AssetType
  name: string
  external_url: string | null
  /** Fase Supabase: ruta en Storage. En local guardamos el Blob aparte. */
  storage_path: string | null
  thumbnail_url: string | null
  metadata: Record<string, unknown>
  created_at: ISODate
  updated_at: ISODate
}

/** Blob local separado del metadato liviano (no viaja en los snapshots). */
export interface AssetBlobRecord {
  id: UUID
  blob: Blob
  width: number
  height: number
  size: number
  mime: string
}

/** Cola de cambios pendientes para la futura sincronizacion. */
export interface PendingChange {
  id?: number
  entity: 'workspace' | 'board' | 'column' | 'task' | 'moodboard' | 'asset'
  entity_id: UUID
  op: 'upsert' | 'delete'
  updated_at: ISODate
}

export interface BackupFile {
  format: 'balodi-workspace-backup'
  version: 1
  exported_at: ISODate
  workspaces: Workspace[]
  boards: Board[]
  columns: Column[]
  tasks: Task[]
  moodboards: Moodboard[]
  assets: Asset[]
}

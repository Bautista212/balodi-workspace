import Dexie, { type Table } from 'dexie'
import type {
  Asset,
  AssetBlobRecord,
  Board,
  Column,
  Moodboard,
  PendingChange,
  Task,
  Workspace,
} from '@/types'

/**
 * IndexedDB local-first.
 * Los indices reflejan los mismos campos que la futura tabla de Postgres
 * (owner_id, workspace_id, board_id, column_id, updated_at).
 */
export class BalodiDB extends Dexie {
  workspaces!: Table<Workspace, string>
  boards!: Table<Board, string>
  columns!: Table<Column, string>
  tasks!: Table<Task, string>
  moodboards!: Table<Moodboard, string>
  assets!: Table<Asset, string>
  assetBlobs!: Table<AssetBlobRecord, string>
  pendingChanges!: Table<PendingChange, number>
  meta!: Table<{ key: string; value: unknown }, string>

  constructor() {
    super('balodi-workspace')
    this.version(1).stores({
      workspaces: 'id, owner_id, updated_at',
      boards: 'id, workspace_id, updated_at',
      columns: 'id, board_id, position',
      tasks: 'id, board_id, column_id, position, updated_at',
      moodboards: 'id, workspace_id, updated_at',
      assets: 'id, workspace_id, moodboard_id, updated_at',
      assetBlobs: 'id',
      pendingChanges: '++id, entity, entity_id',
      meta: 'key',
    })
  }
}

export const db = new BalodiDB()

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const row = await db.meta.get(key)
  return row ? (row.value as T) : fallback
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value })
}

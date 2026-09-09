import { db, getMeta, setMeta } from '@/lib/db'
import { now, uid } from '@/lib/utils'
import { LOCAL_OWNER_ID, STARTER_COLUMNS, buildDemoData } from '@/data/demo'
import type {
  Asset,
  BackupFile,
  Board,
  BoardBundle,
  Column,
  Moodboard,
  MoodboardDocument,
  Viewport,
  Workspace,
} from '@/types'
import type {
  BoardRepository,
  DataRepository,
  MaintenanceRepository,
  MoodboardRepository,
  Page,
  WorkspaceRepository,
} from './types'

const SEED_KEY = 'seeded'

/** Cache de object URLs para no crear uno nuevo por render. */
const objectUrlCache = new Map<string, string>()

export function releaseObjectUrls(): void {
  for (const url of objectUrlCache.values()) URL.revokeObjectURL(url)
  objectUrlCache.clear()
}

async function queueChange(
  entity: 'workspace' | 'board' | 'column' | 'task' | 'moodboard' | 'asset',
  entityId: string,
  op: 'upsert' | 'delete',
): Promise<void> {
  // Cola preparada para la sincronizacion de fase 2. En local solo se acumula.
  await db.pendingChanges.put({ entity, entity_id: entityId, op, updated_at: now() })
  const count = await db.pendingChanges.count()
  if (count > 500) {
    const oldest = await db.pendingChanges.orderBy('id').limit(count - 500).primaryKeys()
    await db.pendingChanges.bulkDelete(oldest)
  }
}

const workspaces: WorkspaceRepository = {
  async list(page?: Page) {
    const all = await db.workspaces.orderBy('updated_at').reverse().toArray()
    const offset = page?.offset ?? 0
    return page?.limit ? all.slice(offset, offset + page.limit) : all
  },
  async get(id) {
    return db.workspaces.get(id)
  },
  async create({ name, description = '' }) {
    const ts = now()
    const workspace: Workspace = {
      id: uid(),
      owner_id: LOCAL_OWNER_ID,
      name,
      description,
      cover_url: null,
      created_at: ts,
      updated_at: ts,
    }
    await db.workspaces.put(workspace)
    await queueChange('workspace', workspace.id, 'upsert')
    return workspace
  },
  async update(id, patch) {
    const current = await db.workspaces.get(id)
    if (!current) throw new Error('El espacio no existe')
    const updated: Workspace = { ...current, ...patch, updated_at: now() }
    await db.workspaces.put(updated)
    await queueChange('workspace', id, 'upsert')
    return updated
  },
  async remove(id) {
    const boardIds = await db.boards.where('workspace_id').equals(id).primaryKeys()
    await db.transaction(
      'rw',
      [db.workspaces, db.boards, db.columns, db.tasks, db.moodboards, db.assets, db.assetBlobs],
      async () => {
        for (const boardId of boardIds) {
          await db.columns.where('board_id').equals(boardId).delete()
          await db.tasks.where('board_id').equals(boardId).delete()
        }
        await db.boards.where('workspace_id').equals(id).delete()
        await db.moodboards.where('workspace_id').equals(id).delete()
        const assetIds = await db.assets.where('workspace_id').equals(id).primaryKeys()
        await db.assetBlobs.bulkDelete(assetIds)
        await db.assets.where('workspace_id').equals(id).delete()
        await db.workspaces.delete(id)
      },
    )
    await queueChange('workspace', id, 'delete')
  },
}

const boards: BoardRepository = {
  async listByWorkspace(workspaceId, page?: Page) {
    const list = await db.boards.where('workspace_id').equals(workspaceId).toArray()
    list.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    const offset = page?.offset ?? 0
    return page?.limit ? list.slice(offset, offset + page.limit) : list
  },
  async getBundle(boardId): Promise<BoardBundle | undefined> {
    const board = await db.boards.get(boardId)
    if (!board) return undefined
    const [columns, tasks] = await Promise.all([
      db.columns.where('board_id').equals(boardId).toArray(),
      db.tasks.where('board_id').equals(boardId).toArray(),
    ])
    columns.sort((a, b) => a.position - b.position)
    tasks.sort((a, b) => a.position - b.position)
    return { board, columns, tasks }
  },
  async create({ workspace_id, name, withStarterColumns = true }) {
    const ts = now()
    const board: Board = {
      id: uid(),
      workspace_id,
      name,
      description: '',
      created_at: ts,
      updated_at: ts,
      version: 1,
    }
    await db.boards.put(board)
    if (withStarterColumns) {
      const columns: Column[] = STARTER_COLUMNS.map((column, index) => ({
        id: uid(),
        board_id: board.id,
        title: column.title,
        color: column.color,
        position: (index + 1) * 1000,
        created_at: ts,
        updated_at: ts,
      }))
      await db.columns.bulkPut(columns)
    }
    await queueChange('board', board.id, 'upsert')
    return board
  },
  async update(id, patch) {
    const current = await db.boards.get(id)
    if (!current) throw new Error('El tablero no existe')
    const updated: Board = { ...current, ...patch, updated_at: now(), version: current.version + 1 }
    await db.boards.put(updated)
    await queueChange('board', id, 'upsert')
    return updated
  },
  async remove(id) {
    await db.transaction('rw', [db.boards, db.columns, db.tasks], async () => {
      await db.columns.where('board_id').equals(id).delete()
      await db.tasks.where('board_id').equals(id).delete()
      await db.boards.delete(id)
    })
    await queueChange('board', id, 'delete')
  },
  async saveColumns(boardId, columns) {
    await db.columns.bulkPut(columns)
    await db.boards.where('id').equals(boardId).modify({ updated_at: now() })
  },
  async saveTasks(boardId, tasks) {
    await db.tasks.bulkPut(tasks)
    await db.boards.where('id').equals(boardId).modify({ updated_at: now() })
  },
  async deleteColumn(_boardId, columnId) {
    await db.transaction('rw', [db.columns, db.tasks], async () => {
      await db.tasks.where('column_id').equals(columnId).delete()
      await db.columns.delete(columnId)
    })
    await queueChange('column', columnId, 'delete')
  },
  async deleteTask(taskId) {
    await db.tasks.delete(taskId)
    await queueChange('task', taskId, 'delete')
  },
}

const moodboards: MoodboardRepository = {
  async listByWorkspace(workspaceId, page?: Page) {
    const list = await db.moodboards.where('workspace_id').equals(workspaceId).toArray()
    list.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    const offset = page?.offset ?? 0
    return page?.limit ? list.slice(offset, offset + page.limit) : list
  },
  async get(id) {
    return db.moodboards.get(id)
  },
  async create({ workspace_id, name, seed }) {
    const ts = now()
    const moodboard: Moodboard = {
      id: uid(),
      workspace_id,
      name,
      viewport_data: { x: 0, y: 0, scale: 1 },
      document_data: seed ?? { items: [] },
      version: 1,
      created_at: ts,
      updated_at: ts,
    }
    await db.moodboards.put(moodboard)
    await queueChange('moodboard', moodboard.id, 'upsert')
    return moodboard
  },
  async rename(id, name) {
    await db.moodboards.where('id').equals(id).modify({ name, updated_at: now() })
    await queueChange('moodboard', id, 'upsert')
  },
  async remove(id) {
    const assetIds = await db.assets.where('moodboard_id').equals(id).primaryKeys()
    await db.assetBlobs.bulkDelete(assetIds)
    await db.assets.where('moodboard_id').equals(id).delete()
    await db.moodboards.delete(id)
    await queueChange('moodboard', id, 'delete')
  },
  async saveSnapshot(id, { document, viewport, version }) {
    const current = await db.moodboards.get(id)
    if (!current) return
    const updated: Moodboard = {
      ...current,
      document_data: document as MoodboardDocument,
      viewport_data: viewport as Viewport,
      version,
      updated_at: now(),
    }
    await db.moodboards.put(updated)
    await queueChange('moodboard', id, 'upsert')
  },
  async putImageAsset({ workspaceId, moodboardId, name, blob, width, height, thumbnail }) {
    const ts = now()
    const asset: Asset = {
      id: uid(),
      workspace_id: workspaceId,
      moodboard_id: moodboardId,
      type: 'image',
      name,
      external_url: null,
      storage_path: null,
      thumbnail_url: thumbnail,
      metadata: { width, height, size: blob.size, mime: blob.type },
      created_at: ts,
      updated_at: ts,
    }
    await db.assets.put(asset)
    await db.assetBlobs.put({ id: asset.id, blob, width, height, size: blob.size, mime: blob.type })
    await queueChange('asset', asset.id, 'upsert')
    return asset
  },
  async getImageUrl(assetId) {
    const cached = objectUrlCache.get(assetId)
    if (cached) return cached
    const record = await db.assetBlobs.get(assetId)
    if (!record) return null
    const url = URL.createObjectURL(record.blob)
    objectUrlCache.set(assetId, url)
    return url
  },
  async listAssets(workspaceId) {
    return db.assets.where('workspace_id').equals(workspaceId).toArray()
  },
}

const maintenance: MaintenanceRepository = {
  async exportBackup(): Promise<BackupFile> {
    const [ws, bs, cs, ts, ms, as] = await Promise.all([
      db.workspaces.toArray(),
      db.boards.toArray(),
      db.columns.toArray(),
      db.tasks.toArray(),
      db.moodboards.toArray(),
      db.assets.toArray(),
    ])
    return {
      format: 'balodi-workspace-backup',
      version: 1,
      exported_at: now(),
      workspaces: ws,
      boards: bs,
      columns: cs,
      tasks: ts,
      moodboards: ms,
      assets: as,
    }
  },
  async importBackup(file) {
    if (file?.format !== 'balodi-workspace-backup') {
      throw new Error('El archivo no es un backup de Balodi Workspace')
    }
    await db.transaction(
      'rw',
      [db.workspaces, db.boards, db.columns, db.tasks, db.moodboards, db.assets],
      async () => {
        await db.workspaces.bulkPut(file.workspaces ?? [])
        await db.boards.bulkPut(file.boards ?? [])
        await db.columns.bulkPut(file.columns ?? [])
        await db.tasks.bulkPut(file.tasks ?? [])
        await db.moodboards.bulkPut(file.moodboards ?? [])
        await db.assets.bulkPut(file.assets ?? [])
      },
    )
    await setMeta(SEED_KEY, true)
  },
  async wipe() {
    releaseObjectUrls()
    await db.transaction(
      'rw',
      [db.workspaces, db.boards, db.columns, db.tasks, db.moodboards, db.assets, db.assetBlobs, db.pendingChanges, db.meta],
      async () => {
        await Promise.all([
          db.workspaces.clear(),
          db.boards.clear(),
          db.columns.clear(),
          db.tasks.clear(),
          db.moodboards.clear(),
          db.assets.clear(),
          db.assetBlobs.clear(),
          db.pendingChanges.clear(),
          db.meta.clear(),
        ])
      },
    )
  },
  async resetDemo() {
    await maintenance.wipe()
    const demo = buildDemoData()
    await db.workspaces.bulkPut(demo.workspaces)
    await db.boards.bulkPut(demo.boards)
    await db.columns.bulkPut(demo.columns)
    await db.tasks.bulkPut(demo.tasks)
    await db.moodboards.bulkPut(demo.moodboards)
    await setMeta(SEED_KEY, true)
  },
  async ensureSeed() {
    const seeded = await getMeta(SEED_KEY, false)
    const count = await db.workspaces.count()
    if (seeded || count > 0) return
    await maintenance.resetDemo()
  },
}

export const localRepository: DataRepository = {
  kind: 'local',
  workspaces,
  boards,
  moodboards,
  maintenance,
}

import type { DataRepository } from './types'

/**
 * FASE 2 — todavia no implementado.
 *
 * Este archivo deja el contrato listo para conectar Supabase sin tocar
 * componentes: la UI habla con DataRepository, no con el cliente de Supabase.
 *
 * Cuando se implemente:
 *  - crear el cliente con VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY;
 *  - seleccionar solo las columnas necesarias (`select('id,name,updated_at')`);
 *  - paginar con `.range(offset, offset + limit - 1)`;
 *  - escribir en lote desde la cola local (`db.pendingChanges`);
 *  - resolver conflictos comparando `updated_at` y `version`;
 *  - suscribirse a Realtime solo al workspace abierto y cerrar al salir.
 *
 * No hay credenciales ni conexiones reales en el codigo.
 */
const notImplemented = (): never => {
  throw new Error('SupabaseRepository todavía no está implementado (fase 2). La app funciona en modo local.')
}

export const supabaseRepository: DataRepository = {
  kind: 'supabase',
  workspaces: {
    list: notImplemented,
    get: notImplemented,
    create: notImplemented,
    update: notImplemented,
    remove: notImplemented,
  },
  boards: {
    listByWorkspace: notImplemented,
    getBundle: notImplemented,
    create: notImplemented,
    update: notImplemented,
    remove: notImplemented,
    saveColumns: notImplemented,
    saveTasks: notImplemented,
    deleteColumn: notImplemented,
    deleteTask: notImplemented,
  },
  moodboards: {
    listByWorkspace: notImplemented,
    get: notImplemented,
    create: notImplemented,
    rename: notImplemented,
    remove: notImplemented,
    saveSnapshot: notImplemented,
    putImageAsset: notImplemented,
    getImageUrl: notImplemented,
    listAssets: notImplemented,
  },
  maintenance: {
    exportBackup: notImplemented,
    importBackup: notImplemented,
    resetDemo: notImplemented,
    wipe: notImplemented,
    ensureSeed: notImplemented,
  },
}

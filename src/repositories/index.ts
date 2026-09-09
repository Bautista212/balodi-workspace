import { dataProvider } from '@/config/env'
import { localRepository } from './LocalRepository'
import { supabaseRepository } from './SupabaseRepository'
import type { DataRepository } from './types'

/**
 * Unico lugar donde se decide el proveedor de datos.
 * Cambiar VITE_DATA_PROVIDER alcanza para cambiar de backend.
 */
export const repository: DataRepository =
  dataProvider === 'supabase' ? supabaseRepository : localRepository

export type { DataRepository } from './types'

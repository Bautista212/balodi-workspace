/**
 * Punto unico donde se lee la configuracion de entorno.
 * Si Supabase no esta configurado, la app arranca igual en modo local.
 */
export type DataProvider = 'local' | 'supabase'

const rawProvider = (import.meta.env.VITE_DATA_PROVIDER ?? 'local') as string
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

export const hasSupabaseCredentials = Boolean(supabaseUrl && supabaseAnonKey)

/** Fase 2: cuando SupabaseRepository este implementado, este valor podra ser 'supabase'. */
export const dataProvider: DataProvider =
  rawProvider === 'supabase' && hasSupabaseCredentials ? 'supabase' : 'local'

export const isLocalMode = dataProvider === 'local'

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  contactUrl: (import.meta.env.VITE_BALODI_CONTACT_URL ?? '').trim(),
  instagramUrl: (import.meta.env.VITE_BALODI_INSTAGRAM_URL ?? '').trim(),
  websiteUrl: (import.meta.env.VITE_BALODI_WEBSITE_URL ?? '').trim(),
}

import { useEffect, useState } from 'react'
import { repository } from '@/repositories'

/**
 * Resuelve el object URL de una imagen guardada en IndexedDB.
 * Los URLs se cachean en el repositorio y se liberan al limpiar la base,
 * asi evitamos crear (y filtrar) uno nuevo en cada render.
 */
export function useAssetUrl(assetId?: string, fallback?: string): string | undefined {
  const [resolved, setResolved] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!assetId) return
    let cancelled = false
    void repository.moodboards.getImageUrl(assetId).then((url) => {
      if (!cancelled && url) setResolved(url)
    })
    return () => {
      cancelled = true
    }
  }, [assetId])

  return assetId ? (resolved ?? fallback) : fallback
}

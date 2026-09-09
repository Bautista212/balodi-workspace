import { useCallback, useRef, useState } from 'react'
import { repository } from '@/repositories'
import { downloadBlob } from '@/lib/utils'
import { toast } from '@/stores/useUiStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import type { BackupFile } from '@/types'

export function useBackup() {
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const reload = useWorkspaceStore((state) => state.reload)

  const exportBackup = useCallback(async () => {
    setBusy(true)
    try {
      const backup = await repository.maintenance.exportBackup()
      downloadBlob(
        new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }),
        `balodi-workspace-${new Date().toISOString().slice(0, 10)}.json`,
      )
      toast({ title: 'Backup exportado', tone: 'success' })
    } catch (error) {
      toast({
        title: 'No se pudo exportar',
        description: error instanceof Error ? error.message : undefined,
        tone: 'danger',
      })
    } finally {
      setBusy(false)
    }
  }, [])

  const importBackup = useCallback(
    async (file: File) => {
      setBusy(true)
      try {
        const parsed = JSON.parse(await file.text()) as BackupFile
        await repository.maintenance.importBackup(parsed)
        await reload()
        toast({ title: 'Backup importado', description: 'Tus espacios están de vuelta.', tone: 'success' })
      } catch (error) {
        toast({
          title: 'No se pudo importar',
          description: error instanceof Error ? error.message : 'Archivo inválido',
          tone: 'danger',
        })
      } finally {
        setBusy(false)
      }
    },
    [reload],
  )

  const resetDemo = useCallback(async () => {
    setBusy(true)
    try {
      await repository.maintenance.resetDemo()
      await reload()
      toast({ title: 'Demo restablecida', tone: 'success' })
    } finally {
      setBusy(false)
    }
  }, [reload])

  return { busy, inputRef, exportBackup, importBackup, resetDemo }
}

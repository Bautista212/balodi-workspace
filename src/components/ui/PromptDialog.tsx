import { useState } from 'react'
import { Button } from './Button'
import { Input, Label, Textarea } from './Field'
import { Modal } from './Modal'

interface PromptDialogProps {
  open: boolean
  title: string
  label: string
  placeholder?: string
  initialValue?: string
  initialDescription?: string
  withDescription?: boolean
  confirmLabel?: string
  onSubmit: (value: string, description?: string) => void
  onClose: () => void
}

export function PromptDialog({
  open,
  title,
  label,
  placeholder,
  initialValue = '',
  initialDescription = '',
  withDescription = false,
  confirmLabel = 'Crear',
  onSubmit,
  onClose,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue)
  const [description, setDescription] = useState(initialDescription)

  const [wasOpen, setWasOpen] = useState(open)

  // Estado derivado: al abrirse el dialogo se recarga con los valores iniciales.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setValue(initialValue)
      setDescription(initialDescription)
    }
  }

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed, description.trim())
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!value.trim()}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Label htmlFor="prompt-value">{label}</Label>
      <Input
        id="prompt-value"
        data-autofocus
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') submit()
        }}
      />
      {withDescription && (
        <div className="mt-4">
          <Label htmlFor="prompt-description">Descripción</Label>
          <Textarea
            id="prompt-description"
            value={description}
            placeholder="Opcional"
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
      )}
    </Modal>
  )
}

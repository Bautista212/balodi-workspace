import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './ui/Button'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // En produccion esto iria a un servicio de monitoreo.
    console.error('[Balodi Workspace]', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl">Algo se rompió en esta pantalla</h1>
        <p className="max-w-md text-sm text-[var(--text-secondary)]">
          Tus datos siguen guardados en este navegador. Recargá para volver a intentar.
        </p>
        <code className="max-w-lg overflow-x-auto rounded-md bg-[var(--surface-muted)] px-3 py-2 text-[12px] text-[var(--text-secondary)]">
          {this.state.error.message}
        </code>
        <Button onClick={() => window.location.reload()}>Recargar</Button>
      </div>
    )
  }
}

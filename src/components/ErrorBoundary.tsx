// created: 2026-11-24T08:58:00-08:00 — stop white-screen crashes for friends
import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

/** created: 2026-11-24T08:58:00-08:00 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // created: 2026-11-24T08:58:00-08:00
    console.error('Rafflesia crash', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-shell">
          <div className="glass-card">
            <h1 className="brand">Something went wrong</h1>
            <p className="muted">Try refreshing. If it stays blank, tell Diyaan.</p>
            <p className="error">{this.state.error.message}</p>
            <button className="primary" type="button" onClick={() => window.location.reload()}>
              Refresh
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

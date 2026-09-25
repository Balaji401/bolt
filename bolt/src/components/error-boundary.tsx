'use client';
import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center px-4">
          <div className="max-w-md text-center">
            <div className="grid place-items-center w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/30 mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-destructive" /></div>
            <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground mb-4">An unexpected error occurred. Try refreshing the page — your data is safe.</p>
            <pre className="text-xs text-muted-foreground bg-secondary/40 border border-border rounded-lg p-3 mb-4 overflow-x-auto text-left">{this.state.error?.message || 'Unknown error'}</pre>
            <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"><RefreshCw className="w-4 h-4" />Refresh page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

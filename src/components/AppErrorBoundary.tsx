import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string };

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Erro inesperado.',
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('RPG application error:', error, info);
  }

  handleReload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <section className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-slate-900 p-8 shadow-2xl">
          <h1 className="text-2xl font-bold">O Mestre Arcano encontrou um erro</h1>
          <p className="mt-3 text-slate-300">
            A aplicação não conseguiu renderizar esta tela. Seus dados salvos no navegador não foram apagados.
          </p>
          {this.state.message && (
            <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-black/30 p-3 text-xs text-red-200 whitespace-pre-wrap">
              {this.state.message}
            </pre>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-6 rounded-lg bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Recarregar aplicação
          </button>
        </section>
      </main>
    );
  }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-[#0f172a] border border-red-500/20 rounded-3xl m-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-4 tracking-tight">Ops! Algo deu errado.</h2>
          <p className="text-slate-400 max-w-md mb-8 text-sm font-medium leading-relaxed">
            Ocorreu um erro inesperado nesta seção. Nossa equipe técnica já foi notificada.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20"
          >
            <RefreshCcw size={18} />
            Tentar Novamente
          </button>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-black/40 rounded-xl border border-white/5 text-left overflow-auto max-w-2xl w-full">
              <p className="text-red-400 font-mono text-[10px] whitespace-pre-wrap">
                {this.state.error?.toString()}
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

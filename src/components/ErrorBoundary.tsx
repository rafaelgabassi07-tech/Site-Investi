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
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-[#020617] border border-red-500/20 rounded-[2.5rem] m-4 shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mb-8 border border-red-500/20 animate-pulse">
            <AlertTriangle size={36} className="text-red-500" />
          </div>
          <h2 className="text-3xl font-display font-black text-white mb-4 tracking-tighter uppercase italic">Ops! Algo deu errado.</h2>
          <p className="text-slate-400 max-w-md mb-8 text-sm font-bold leading-relaxed uppercase tracking-widest">
            Ocorreu um erro no motor de processamento Nexus. Nossa equipe técnica já foi notificada.
          </p>
          
          <div className="p-6 bg-black/40 rounded-2xl border border-white/5 text-left overflow-auto max-w-2xl w-full mb-8">
            <p className="text-red-400 font-mono text-[10px] leading-relaxed break-all">
              {this.state.error?.name}: {this.state.error?.message}
            </p>
            {this.state.error?.stack && (
              <details className="mt-4">
                <summary className="text-[9px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-300 transition-colors">Ver Stack Trace</summary>
                <div className="mt-2 text-slate-600 font-mono text-[8px] whitespace-pre-wrap leading-tight">
                  {this.state.error?.stack}
                </div>
              </details>
            )}
          </div>

          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-3 px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 italic"
          >
            <RefreshCcw size={18} />
            Reiniciar Módulo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

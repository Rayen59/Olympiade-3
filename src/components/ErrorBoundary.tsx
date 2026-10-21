import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
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
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.hash = '#problems';
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white border border-rose-200 rounded-xl p-6 sm:p-8 text-center max-w-lg mx-auto my-10 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {this.props.fallbackTitle || 'Affichage temporairement indisponible'}
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Une erreur inattendue est survenue lors de l’affichage de cette vue. Cliquez ci-dessous pour revenir à l’accueil.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0056b3] text-white text-xs font-bold rounded-lg hover:bg-[#0a3d75] transition shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Réinitialiser
            </button>
            <button
              onClick={() => {
                window.location.hash = '#problems';
                window.location.reload();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition border border-slate-300 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              Accueil
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

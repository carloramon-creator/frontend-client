import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center z-[9999]">
                    <h1 className="text-2xl font-black text-red-500 mb-4 uppercase">Erro Crítico</h1>
                    <p className="text-slate-400 mb-4">Ocorreu um erro inesperado ao carregar o aplicativo.</p>
                    <div className="bg-slate-900 p-4 rounded-xl border border-red-900/50 max-w-full overflow-auto text-left mb-6">
                        <code className="text-xs text-red-400 font-mono break-all whitespace-pre-wrap">
                            {this.state.error?.message}
                            <br />
                            {this.state.error?.stack?.slice(0, 300)}...
                        </code>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-red-600 rounded-xl font-bold uppercase tracking-wider hover:bg-red-700"
                    >
                        Recarregar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

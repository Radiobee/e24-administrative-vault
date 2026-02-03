import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCcw, ShieldAlert } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen bg-e24-void items-center justify-center flex-col text-gray-300 font-mono gap-6 border-4 border-e24-border">
            <div className="bg-e24-lattice border border-e24-border p-8 rounded-lg max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center">
                <ShieldAlert size={64} className="text-e24-node mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-white mb-2">System Interruption</h1>
                <p className="text-gray-500 text-sm mb-6">
                    The Fiduciary Operating System encountered a runtime anomaly. 
                    State integrity has been preserved, but the interface requires a reset.
                </p>
                <div className="bg-black/50 p-4 rounded border border-gray-800 text-left mb-6 overflow-auto max-h-32">
                    <p className="text-xs text-e24-shard font-bold mb-1">ERROR_TRACE:</p>
                    <code className="text-[10px] text-gray-500 block">
                        {this.state.error?.toString() || "Unknown Error"}
                    </code>
                </div>
                <button 
                    onClick={() => window.location.reload()}
                    className="w-full bg-e24-flux text-black font-bold py-3 rounded flex items-center justify-center gap-2 hover:bg-cyan-400 transition-colors"
                >
                    <RefreshCcw size={18} /> REBOOT INTERFACE
                </button>
            </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
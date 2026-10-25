import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('FinSafe Caught Component Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 text-neutral-900">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs">
              <AlertCircle className="w-7 h-7 stroke-2" />
            </div>

            <div>
              <h2 className="text-xl font-bold font-['Outfit'] text-neutral-900">
                Something went wrong
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                An unexpected display error occurred. Your financial data is safely stored.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-neutral-100 text-left font-mono text-[11px] text-neutral-700 max-h-28 overflow-y-auto border border-neutral-200 wrap-break-word">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-black border border-yellow-400 gold-button-gradient shadow-xs transition-transform hover:scale-[1.02] flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

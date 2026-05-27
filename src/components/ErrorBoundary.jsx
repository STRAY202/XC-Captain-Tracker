import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
          <div className="text-center max-w-xs">
            <div className="text-4xl mb-4">💥</div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              An unexpected error occurred. Reloading the app usually fixes it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 active:scale-95 transition-all"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

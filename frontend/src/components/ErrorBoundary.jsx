import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Cortex crashed:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="bg-[#0a0a0f] min-h-screen text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)' }} />

        <div className="relative z-10 text-center max-w-md">
          <div className="text-6xl mb-6">⚡</div>
          <h1 className="text-2xl md:text-3xl font-black mb-3 tracking-tight">
            Something went wrong<span className="text-red-400">.</span>
          </h1>
          <p className="text-gray-500 text-sm mb-3 leading-relaxed">
            Cortex hit an unexpected error. Your saved data is safe — this is just a display issue.
          </p>

          {/* Error details (collapsed) */}
          {this.state.error && (
            <details className="mb-8 text-left border border-white/5 rounded-xl overflow-hidden">
              <summary className="px-4 py-3 text-xs text-gray-600 cursor-pointer hover:text-gray-400 transition"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                Show error details
              </summary>
              <div className="px-4 py-3 border-t border-white/5"
                style={{ background: 'rgba(239,68,68,0.03)' }}>
                <code className="text-red-400/70 text-xs break-all leading-relaxed">
                  {this.state.error.toString()}
                </code>
              </div>
            </details>
          )}

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-full font-bold transition active:scale-95 text-sm">
              ← Go Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-full font-bold transition active:scale-95 text-sm text-gray-300">
              Try again
            </button>
          </div>

          <div className="mt-12 text-gray-700 text-sm font-black">
            cortex<span className="text-purple-400/40">.</span>
          </div>
        </div>
      </div>
    )
  }
}

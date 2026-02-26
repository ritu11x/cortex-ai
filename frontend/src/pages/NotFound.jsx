import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const navigate = useNavigate()
  const [count, setCount] = useState(5)

  useEffect(() => {
    document.title = '404 — Page Not Found | Cortex'
    const t = setInterval(() => {
      setCount(c => {
        if (c <= 1) { clearInterval(t); navigate('/'); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="bg-[#0a0a0f] min-h-screen text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      {/* Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />

      <div className="relative z-10 text-center">
        {/* Big 404 */}
        <div className="text-[160px] md:text-[220px] font-black leading-none tracking-tighter text-white/5 select-none mb-0">
          404
        </div>

        {/* Floating brain */}
        <div className="text-6xl mb-6 -mt-8" style={{ animation: 'jelly-float 3s ease-in-out infinite' }}>
          🧠
        </div>

        <h1 className="text-2xl md:text-3xl font-black mb-3 tracking-tight">
          Lost in the void<span className="text-purple-400">.</span>
        </h1>
        <p className="text-gray-500 text-base mb-2 max-w-sm mx-auto leading-relaxed">
          This page doesn't exist in your second brain — or anywhere else.
        </p>
        <p className="text-gray-700 text-sm mb-10">
          Redirecting to home in <span className="text-purple-400 font-bold">{count}s</span>
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => navigate('/')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-full font-bold transition active:scale-95 text-sm">
            ← Go Home
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="px-6 py-3 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-full font-bold transition active:scale-95 text-sm text-gray-300">
            Open Dashboard
          </button>
        </div>

        {/* Cortex logo */}
        <div className="mt-16 text-gray-700 text-sm font-black">
          cortex<span className="text-purple-400/40">.</span>
        </div>
      </div>
    </div>
  )
}

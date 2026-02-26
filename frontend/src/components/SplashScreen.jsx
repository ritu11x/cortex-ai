import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0)
  // phase 0 = dot grows, 1 = text appears, 2 = tagline, 3 = fade out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400)
    const t2 = setTimeout(() => setPhase(2), 900)
    const t3 = setTimeout(() => setPhase(3), 1800)
    const t4 = setTimeout(() => onDone(), 2300)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [])

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: '#0a0a0f',
        transition: 'opacity 0.5s ease',
        opacity: phase === 3 ? 0 : 1,
        pointerEvents: phase === 3 ? 'none' : 'all',
      }}>

      {/* Grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-end gap-0 mb-4"
          style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)' }}>
          <span className="text-5xl font-black tracking-tight text-white">cortex</span>
          <span className="text-5xl font-black text-purple-400" style={{ animation: phase >= 1 ? 'pulse 2s ease infinite' : 'none' }}>.</span>
        </div>

        {/* Tagline */}
        <p className="text-gray-600 text-sm font-medium tracking-widest uppercase"
          style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(6px)', transition: 'all 0.4s ease 0.1s' }}>
          Your AI Second Brain
        </p>

        {/* Loading bar */}
        <div className="mt-10 w-32 h-0.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.05)', opacity: phase >= 1 ? 1 : 0 }}>
          <div className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
              width: phase >= 3 ? '100%' : phase >= 2 ? '75%' : phase >= 1 ? '40%' : '0%',
              transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)',
            }} />
        </div>
      </div>
    </div>
  )
}

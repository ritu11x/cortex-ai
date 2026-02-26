import { useState, useEffect } from 'react'

const tips = [
  'Paste a YouTube link → AI summarizes the video',
  'Save an Instagram reel → Cortex tags it automatically',
  'Write a quick note → AI organizes it by topic',
  'Save a tweet → Find it instantly later with search',
  'Paste any article → AI gives you the key points',
]

export default function EmptyState({ onSave }) {
  const [tipIndex, setTipIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setTipIndex(i => (i + 1) % tips.length)
        setVisible(true)
      }, 400)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center px-6">

      {/* Animated icon cluster */}
      <div className="relative w-36 h-36 mb-8">
        {/* Center brain */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl z-10"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.1))',
            border: '1px solid rgba(124,58,237,0.2)',
            animation: 'jelly-float 3s ease-in-out infinite',
          }}>
          🧠
        </div>

        {/* Orbiting icons */}
        {[
          { icon: '▶', color: '#f87171', angle: 0,   bg: 'rgba(248,113,113,0.1)'  },
          { icon: '📸', color: '#f472b6', angle: 72,  bg: 'rgba(244,114,182,0.1)' },
          { icon: '𝕏',  color: '#60a5fa', angle: 144, bg: 'rgba(96,165,250,0.1)'  },
          { icon: '✦',  color: '#a78bfa', angle: 216, bg: 'rgba(167,139,250,0.1)' },
          { icon: '↗',  color: '#34d399', angle: 288, bg: 'rgba(52,211,153,0.1)'  },
        ].map((item, i) => {
          const rad = (item.angle * Math.PI) / 180
          const x = 50 + 42 * Math.cos(rad)
          const y = 50 + 42 * Math.sin(rad)
          return (
            <div key={i}
              className="absolute w-9 h-9 rounded-xl flex items-center justify-center text-sm border border-white/5"
              style={{
                left: `${x}%`, top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                background: item.bg, color: item.color,
                animation: `jelly-float ${2.5 + i * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
              }}>
              {item.icon}
            </div>
          )
        })}
      </div>

      <h2 className="text-2xl md:text-3xl font-black mb-3 tracking-tight">
        Your Cortex is empty<span className="text-purple-400">.</span>
      </h2>
      <p className="text-gray-500 text-base mb-3 max-w-xs leading-relaxed">
        Start saving ideas from anywhere. AI will organize everything automatically.
      </p>

      {/* Rotating tip */}
      <div className="mb-8 h-8 flex items-center">
        <p className="text-sm text-purple-400/70 transition-all duration-400 flex items-center gap-2"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(6px)' }}>
          <span className="text-yellow-400">⚡</span>
          {tips[tipIndex]}
        </p>
      </div>

      {/* CTA */}
      <button onClick={onSave}
        className="px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-full font-bold text-base transition active:scale-95 flex items-center gap-2 group mb-6">
        <span className="group-hover:rotate-12 transition-transform">✦</span>
        Save your first idea
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </button>

      {/* Quick action pills */}
      <div className="flex flex-wrap gap-2 justify-center">
        {[
          { icon: '▶', label: 'YouTube link', color: 'text-red-400 border-red-500/20 bg-red-500/5' },
          { icon: '📸', label: 'Instagram', color: 'text-pink-400 border-pink-500/20 bg-pink-500/5' },
          { icon: '✦', label: 'Quick note', color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' },
          { icon: '↗', label: 'Any URL', color: 'text-gray-400 border-gray-500/20 bg-gray-500/5' },
        ].map(pill => (
          <button key={pill.label} onClick={onSave}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition hover:scale-105 active:scale-95 ${pill.color}`}>
            {pill.icon} {pill.label}
          </button>
        ))}
      </div>
    </div>
  )
}

import { useEffect, useRef } from 'react'

// Milestone thresholds
export const MILESTONES = [10, 25, 50, 100, 250, 500]

export function checkMilestone(prevCount, newCount) {
  return MILESTONES.find(m => prevCount < m && newCount >= m) || null
}

const COLORS = ['#a78bfa','#f472b6','#34d399','#fbbf24','#60a5fa','#ffffff','#7c3aed']

function randomBetween(a, b) { return a + Math.random() * (b - a) }

export default function ConfettiBurst({ milestone, onDone }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!milestone) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Spawn particles from center-top
    const particles = Array.from({ length: 120 }, () => ({
      x: canvas.width / 2 + randomBetween(-100, 100),
      y: canvas.height * 0.35,
      vx: randomBetween(-12, 12),
      vy: randomBetween(-18, -4),
      size: randomBetween(6, 14),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: randomBetween(0, 360),
      rotSpeed: randomBetween(-8, 8),
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      opacity: 1,
      gravity: randomBetween(0.4, 0.8),
    }))

    let frame = 0
    const maxFrames = 120

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += p.gravity
        p.vx *= 0.99
        p.rotation += p.rotSpeed
        p.opacity = Math.max(0, 1 - frame / maxFrames)

        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      })

      frame++
      if (frame < maxFrames) {
        requestAnimationFrame(draw)
      } else {
        onDone?.()
      }
    }
    draw()
  }, [milestone])

  if (!milestone) return null

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex flex-col items-center justify-center">
      {/* Canvas confetti */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Milestone toast */}
      <div className="relative z-10 text-center px-8 py-6 rounded-2xl border"
        style={{
          background: 'linear-gradient(135deg, rgba(15,15,26,0.95), rgba(10,10,18,0.95))',
          border: '1px solid rgba(124,58,237,0.4)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(124,58,237,0.15)',
          animation: 'bounce-in 0.5s cubic-bezier(0.22,1,0.36,1) both',
        }}>
        <div className="text-5xl mb-3">🎉</div>
        <div className="text-white font-black text-2xl mb-1">
          {milestone} ideas saved!
        </div>
        <div className="text-gray-400 text-sm">
          Your second brain is growing<span className="text-purple-400">.</span>
        </div>
        <div className="mt-4 flex justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-yellow-400 text-lg" style={{ animationDelay: `${i * 0.1}s`, animation: 'bounce-in 0.4s ease both' }}>⭐</span>
          ))}
        </div>
      </div>
    </div>
  )
}

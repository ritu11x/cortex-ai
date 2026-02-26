import { useEffect, useRef, useState } from 'react'

export default function LiquidCursor() {
  const blobRef = useRef(null)
  const trailRef = useRef(null)
  const pos = useRef({ x: -200, y: -200 })
  const trail = useRef({ x: -200, y: -200 })
  const raf = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (!visible) setVisible(true)
    }
    const onLeave = () => setVisible(false)
    const onEnter = () => setVisible(true)

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    // Smooth lerp loop
    const lerp = (a, b, t) => a + (b - a) * t
    const loop = () => {
      trail.current.x = lerp(trail.current.x, pos.current.x, 0.09)
      trail.current.y = lerp(trail.current.y, pos.current.y, 0.09)

      if (blobRef.current) {
        blobRef.current.style.transform =
          `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`
      }
      if (trailRef.current) {
        trailRef.current.style.transform =
          `translate(${trail.current.x}px, ${trail.current.y}px) translate(-50%, -50%)`
      }
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  // Hide on touch devices
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return null

  return (
    <>
      <style>{`
        * { cursor: none !important; }

        @keyframes blob-morph {
          0%,100% { border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%; }
          25%      { border-radius: 40% 60% 45% 55% / 60% 40% 55% 45%; }
          50%      { border-radius: 55% 45% 60% 40% / 45% 55% 50% 50%; }
          75%      { border-radius: 45% 55% 40% 60% / 55% 45% 60% 40%; }
        }

        @keyframes trail-morph {
          0%,100% { border-radius: 50% 50% 60% 40% / 60% 40% 50% 50%; }
          50%      { border-radius: 40% 60% 50% 50% / 50% 50% 40% 60%; }
        }

        .liquid-cursor-blob {
          pointer-events: none;
          position: fixed;
          top: 0; left: 0;
          z-index: 99999;
          width: 28px;
          height: 28px;
          background: radial-gradient(circle at 35% 35%,
            rgba(192, 132, 252, 0.95),
            rgba(124, 58, 237, 0.85));
          mix-blend-mode: screen;
          animation: blob-morph 2.5s ease-in-out infinite;
          filter: blur(0.5px);
          box-shadow:
            0 0 12px rgba(167, 139, 250, 0.6),
            0 0 30px rgba(124, 58, 237, 0.3);
          transition: opacity 0.3s ease, width 0.2s ease, height 0.2s ease;
          will-change: transform;
        }

        .liquid-cursor-trail {
          pointer-events: none;
          position: fixed;
          top: 0; left: 0;
          z-index: 99998;
          width: 56px;
          height: 56px;
          background: radial-gradient(circle at 40% 40%,
            rgba(236, 72, 153, 0.25),
            rgba(124, 58, 237, 0.12));
          animation: trail-morph 3.5s ease-in-out infinite;
          filter: blur(8px);
          transition: opacity 0.4s ease;
          will-change: transform;
        }

        /* Grow on hoverable elements */
        a:hover ~ .liquid-cursor-blob,
        button:hover ~ .liquid-cursor-blob {
          width: 44px;
          height: 44px;
        }
      `}</style>

      {/* Trail (slow, blurry) */}
      <div
        ref={trailRef}
        className="liquid-cursor-trail"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Main blob (fast, sharp) */}
      <div
        ref={blobRef}
        className="liquid-cursor-blob"
        style={{ opacity: visible ? 1 : 0 }}
      />
    </>
  )
}

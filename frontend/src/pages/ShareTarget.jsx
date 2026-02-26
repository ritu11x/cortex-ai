import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ✅ This page handles incoming shares from mobile apps
// When user shares from YouTube/Instagram → Cortex → this page catches it
// Then redirects to dashboard with save modal open

export default function ShareTarget() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing') // processing | redirecting | error

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const sharedUrl   = params.get('url')   || ''
      const sharedTitle = params.get('title') || ''
      const sharedText  = params.get('text')  || ''

      // 'text' sometimes contains the URL when sharing from apps
      const finalUrl = sharedUrl || (sharedText.startsWith('http') ? sharedText : '') || ''
      const finalText = (!sharedText.startsWith('http') ? sharedText : '') || ''

      if (!finalUrl && !sharedText && !sharedTitle) {
        // Nothing shared — just go to dashboard
        navigate('/dashboard')
        return
      }

      // ✅ Store in sessionStorage so Dashboard picks it up
      const content = {
        url:     finalUrl,
        title:   sharedTitle,
        content: finalText,
      }
      sessionStorage.setItem('sharedContent', JSON.stringify(content))

      setStatus('redirecting')

      // Small delay so user sees the animation
      setTimeout(() => {
        navigate('/dashboard?openSave=true')
      }, 1000)

    } catch (err) {
      console.error('Share target error:', err)
      setStatus('error')
      setTimeout(() => navigate('/dashboard'), 2000)
    }
  }, [])

  return (
    <div className="bg-[#0a0a0f] min-h-screen flex items-center justify-center">

      {/* Background grid */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      <div className="fixed top-[-200px] left-[20%] w-[400px] h-[400px] rounded-full z-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />

      <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">

        {status === 'processing' && (
          <>
            {/* Spinning brain logo */}
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center text-4xl"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.1))', border: '1px solid rgba(124,58,237,0.3)' }}>
                🧠
              </div>
              {/* Spinning ring */}
              <svg className="absolute inset-0 w-full h-full animate-spin" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="url(#grad)" strokeWidth="2" strokeDasharray="60 160" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed"/>
                    <stop offset="100%" stopColor="#ec4899"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <p className="text-white font-black text-xl mb-1">Processing share...</p>
              <p className="text-gray-600 text-sm">Reading your shared content</p>
            </div>
          </>
        )}

        {status === 'redirecting' && (
          <>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl relative"
              style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.1))', border: '1px solid rgba(52,211,153,0.3)' }}>
              ✓
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-2xl animate-ping opacity-20"
                style={{ background: 'rgba(52,211,153,0.3)' }} />
            </div>
            <div>
              <p className="text-white font-black text-xl mb-1">Got it! Opening Cortex...</p>
              <p className="text-gray-600 text-sm">Taking you to save this now</p>
            </div>
            {/* Progress bar */}
            <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="h-full rounded-full animate-pulse"
                style={{ background: 'linear-gradient(90deg, #7c3aed, #ec4899)', width: '100%' }} />
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠️
            </div>
            <div>
              <p className="text-white font-black text-xl mb-1">Something went wrong</p>
              <p className="text-gray-600 text-sm">Taking you to your dashboard...</p>
            </div>
          </>
        )}

        {/* Cortex branding */}
        <p className="text-gray-800 text-sm font-black mt-4">
          cortex<span className="text-purple-900">.</span>
        </p>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'

// Animated fake demo — plays like a screen recording of Cortex
export default function DemoModal({ onClose }) {
  const [step, setStep] = useState(0)
  const [typed, setTyped] = useState('')
  const [showCard, setShowCard] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const [showGraph, setShowGraph] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [currentScene, setCurrentScene] = useState(0) // 0=save, 1=graph, 2=search
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef(null)

  const URL_TEXT = 'https://youtube.com/watch?v=dQw4w9...'
  const SEARCH_TEXT = 'AI productivity'
  const TOTAL_DURATION = 18000 // 18 seconds total

  useEffect(() => {
    // Progress bar
    const start = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      setProgress(Math.min((elapsed / TOTAL_DURATION) * 100, 100))
      if (elapsed >= TOTAL_DURATION) {
        clearInterval(intervalRef.current)
        // Loop
        setTimeout(() => resetDemo(), 1000)
      }
    }, 50)

    runScene0()
    return () => clearInterval(intervalRef.current)
  }, [])

  const resetDemo = () => {
    setStep(0); setTyped(''); setShowCard(false); setShowSummary(false)
    setShowTags(false); setShowGraph(false); setShowSearch(false)
    setSearchText(''); setShowResult(false); setCurrentScene(0); setProgress(0)
    setTimeout(() => runScene0(), 200)
  }

  const typeText = (text, setter, speed = 60) => {
    return new Promise(resolve => {
      let i = 0
      const t = setInterval(() => {
        setter(text.slice(0, i + 1))
        i++
        if (i >= text.length) { clearInterval(t); resolve() }
      }, speed)
    })
  }

  const wait = (ms) => new Promise(r => setTimeout(r, ms))

  const runScene0 = async () => {
    setCurrentScene(0)
    await wait(600)
    setStep(1) // show modal
    await wait(400)
    await typeText(URL_TEXT, setTyped, 40)
    await wait(500)
    setStep(2) // fetching
    await wait(1200)
    setStep(3) // fetched
    await wait(400)
    setShowCard(true)
    await wait(600)
    setShowSummary(true)
    await wait(500)
    setShowTags(true)
    await wait(1000)
    setStep(4) // saved!
    await wait(1200)

    // Scene 2: Graph
    setCurrentScene(1)
    setStep(5)
    await wait(400)
    setShowGraph(true)
    await wait(3000)

    // Scene 3: Search
    setCurrentScene(2)
    setStep(6)
    setShowSearch(true)
    await wait(400)
    await typeText(SEARCH_TEXT, setSearchText, 80)
    await wait(600)
    setShowResult(true)
    await wait(2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ animation: 'backdrop-in 0.2s ease both' }}
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

      <div className="relative z-10 w-full max-w-2xl"
        style={{ animation: 'modal-slide-up 0.35s cubic-bezier(0.22,1,0.36,1) both' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-white font-bold text-sm">Cortex — Live Demo</span>
            <span className="text-xs text-purple-400/60 border border-purple-500/20 px-2 py-0.5 rounded-full ml-1"
              style={{ background: 'rgba(124,58,237,0.08)' }}>
              ✦ Interactive Preview
            </span>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition active:scale-95">✕</button>
        </div>

        {/* Screen */}
        <div className="rounded-2xl overflow-hidden border border-white/10 relative"
          style={{ background: '#0a0a0f', boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(139,92,246,0.2)', minHeight: 380 }}>

          {/* Fake browser bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5"
            style={{ background: '#0f0f1a' }}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <div className="flex-1 mx-3 px-3 py-1 rounded-md text-xs text-gray-600 border border-white/5"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              trycortex.ai/dashboard
            </div>
            <span className="text-xs text-gray-700">cortex<span className="text-purple-400">.</span></span>
          </div>

          {/* Scene content */}
          <div className="p-5 relative" style={{ minHeight: 320 }}>

            {/* ── SCENE 0 & 1: Save flow ── */}
            {(currentScene === 0) && (
              <div>
                {/* Dashboard header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}>⚡</div>
                  <div>
                    <div className="text-white font-black text-lg">Good afternoon, Ritu<span className="text-purple-400">.</span></div>
                    <div className="text-gray-600 text-xs">Your second brain is ready</div>
                  </div>
                  <div className="ml-auto">
                    <div className="px-4 py-2 rounded-full text-sm font-bold text-white flex items-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                      + Save
                    </div>
                  </div>
                </div>

                {/* Save modal */}
                {step >= 1 && (
                  <div className="border border-white/10 rounded-2xl overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)', animation: 'modal-slide-up 0.3s ease both' }}>
                    <div className="flex justify-between items-center px-5 py-4 border-b border-white/5">
                      <span className="text-white font-black text-sm">Save to your Brain</span>
                      <span className="text-gray-600 text-xs">✕</span>
                    </div>
                    <div className="px-5 py-4">
                      {/* Platform tabs */}
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {[
                          { id: 'youtube', icon: '▶', label: 'YouTube', active: true, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
                          { id: 'instagram', icon: '📸', label: 'Instagram', active: false },
                          { id: 'twitter', icon: '𝕏', label: 'Twitter', active: false },
                        ].map(p => (
                          <div key={p.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium ${p.active ? p.color : 'border-white/5 text-gray-600'}`}>
                            {p.icon} {p.label}
                          </div>
                        ))}
                      </div>

                      {/* URL input */}
                      <div className="relative mb-3">
                        <div className="w-full border rounded-xl px-3 py-2.5 text-xs font-mono flex items-center justify-between"
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderColor: step === 2 ? 'rgba(167,139,250,0.4)' : step >= 3 ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.05)',
                          }}>
                          <span className={step >= 1 ? 'text-gray-300' : 'text-gray-600'}>
                            {typed || <span className="text-gray-600">Paste YouTube URL...</span>}
                          </span>
                          {step === 2 && <div className="w-4 h-4 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />}
                          {step >= 3 && <span className="text-green-400">✓</span>}
                        </div>
                      </div>

                      {/* Fetching indicator */}
                      {step === 2 && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-500/20 bg-purple-500/5 mb-3"
                          style={{ animation: 'card-slide-up 0.3s ease both' }}>
                          <div className="w-3 h-3 rounded-full border border-purple-500/30 border-t-purple-500 animate-spin" />
                          <span className="text-purple-400 text-xs">Fetching page info automatically...</span>
                        </div>
                      )}

                      {/* Auto-filled card */}
                      {step >= 3 && (
                        <div style={{ animation: 'card-slide-up 0.4s ease both' }}>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-500/20 bg-green-500/5 mb-3">
                            <span className="text-green-400 text-xs font-bold">✓</span>
                            <span className="text-green-400 text-xs">Title & thumbnail fetched automatically!</span>
                          </div>

                          {/* Thumbnail */}
                          <div className="rounded-xl overflow-hidden mb-3 border border-white/5 relative" style={{ height: 80 }}>
                            <div className="w-full h-full flex items-center justify-center"
                              style={{ background: 'linear-gradient(135deg, rgba(255,0,0,0.15), rgba(124,58,237,0.1))' }}>
                              <span className="text-3xl">▶</span>
                              <div className="absolute bottom-2 left-3 text-xs text-white/60 bg-black/50 px-2 py-0.5 rounded-full">YouTube Thumbnail</div>
                            </div>
                          </div>

                          {/* Auto title */}
                          <div className="border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 mb-2"
                            style={{ background: 'rgba(255,255,255,0.03)' }}>
                            How to Build a Second Brain with AI in 2026
                          </div>
                        </div>
                      )}

                      {/* AI Summary preview */}
                      {showSummary && (
                        <div className="border border-purple-500/20 rounded-xl p-3 mb-2"
                          style={{ background: 'rgba(124,58,237,0.06)', animation: 'card-slide-up 0.4s ease both' }}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                            <span className="text-purple-400 text-xs font-semibold">✦ AI Summary</span>
                          </div>
                          <p className="text-gray-400 text-xs leading-relaxed">A comprehensive guide to using AI tools for building a personal knowledge management system...</p>
                        </div>
                      )}

                      {/* Tags */}
                      {showTags && (
                        <div className="flex gap-2 flex-wrap mb-3" style={{ animation: 'card-slide-up 0.3s ease both' }}>
                          {['#productivity', '#AI', '#learning', '#youtube'].map(tag => (
                            <span key={tag} className="text-xs text-purple-300/60 bg-purple-400/5 border border-purple-400/10 px-2 py-0.5 rounded-full">{tag}</span>
                          ))}
                        </div>
                      )}

                      {/* Save button */}
                      {step === 4 ? (
                        <div className="w-full py-2.5 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-2"
                          style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.1))', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', animation: 'bounce-in 0.4s ease both' }}>
                          ✓ Saved to your Cortex!
                        </div>
                      ) : (
                        <div className="w-full py-2.5 rounded-xl font-bold text-xs text-center text-white"
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', opacity: step < 3 ? 0.5 : 1 }}>
                          {step < 3 ? '⏳ Fetching...' : 'Save from YouTube →'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SCENE 1: Knowledge Graph ── */}
            {currentScene === 1 && (
              <div style={{ animation: 'page-fade-in 0.4s ease both' }}>
                <div className="text-center mb-4">
                  <div className="text-white font-black text-lg mb-1">Knowledge Graph</div>
                  <div className="text-gray-600 text-xs">See how your ideas connect</div>
                </div>
                {showGraph && (
                  <div className="relative mx-auto" style={{ height: 240, animation: 'page-fade-in 0.5s ease both' }}>
                    {/* Center node */}
                    <div className="absolute w-14 h-14 rounded-full border-2 border-purple-500/60 flex items-center justify-center text-purple-400 font-black text-sm"
                      style={{ background: 'rgba(124,58,237,0.2)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', boxShadow: '0 0 30px rgba(124,58,237,0.3)', zIndex: 10 }}>
                      C
                    </div>

                    {/* Connected nodes */}
                    {[
                      { label: 'AI', x: '20%', y: '15%', color: '#a78bfa', delay: '0.1s' },
                      { label: 'YouTube', x: '75%', y: '12%', color: '#f87171', delay: '0.2s' },
                      { label: 'Productivity', x: '10%', y: '65%', color: '#34d399', delay: '0.3s' },
                      { label: 'Learning', x: '75%', y: '70%', color: '#fbbf24', delay: '0.4s' },
                      { label: 'Notes', x: '45%', y: '82%', color: '#60a5fa', delay: '0.5s' },
                    ].map((node) => (
                      <div key={node.label}>
                        {/* Connection line */}
                        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                          <line
                            x1="50%" y1="50%"
                            x2={node.x} y2={node.y}
                            stroke={node.color} strokeOpacity="0.2" strokeWidth="1"
                            style={{ animation: `page-fade-in 0.5s ${node.delay} both` }}
                          />
                        </svg>
                        {/* Node */}
                        <div className="absolute px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1"
                          style={{
                            left: node.x, top: node.y,
                            transform: 'translate(-50%,-50%)',
                            background: `${node.color}15`,
                            borderColor: `${node.color}40`,
                            color: node.color,
                            zIndex: 5,
                            animation: `bounce-in 0.5s ${node.delay} both`,
                          }}>
                          {node.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── SCENE 2: Search ── */}
            {currentScene === 2 && (
              <div style={{ animation: 'page-fade-in 0.4s ease both' }}>
                <div className="text-white font-black text-lg mb-4">Your Second Brain</div>

                {/* Search bar */}
                <div className="relative mb-5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm">⌕</span>
                  <div className="w-full border border-purple-500/30 rounded-xl pl-10 pr-4 py-3 text-sm"
                    style={{ background: 'rgba(124,58,237,0.05)' }}>
                    <span className="text-gray-200">{searchText}</span>
                    <span className="border-r-2 border-purple-400 ml-0.5 animate-pulse">&nbsp;</span>
                  </div>
                </div>

                {/* Search results */}
                {showResult && (
                  <div className="flex flex-col gap-3">
                    {[
                      { title: 'How to Build a Second Brain with AI', source: 'YouTube', tag: 'AI', color: '#f87171', icon: '▶' },
                      { title: 'Top 10 Productivity Tools for 2026', source: 'Article', tag: 'Productivity', color: '#a78bfa', icon: '↗' },
                      { title: 'Deep Work — Focus in a Distracted World', source: 'Note', tag: 'Learning', color: '#34d399', icon: '✦' },
                    ].map((r, i) => (
                      <div key={r.title} className="flex items-center gap-3 border border-white/5 rounded-xl p-3"
                        style={{
                          background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)',
                          animation: `card-slide-up 0.4s ${i * 0.1}s both`
                        }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm"
                          style={{ background: `${r.color}15`, color: r.color, border: `1px solid ${r.color}30` }}>
                          {r.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-semibold truncate">{r.title}</div>
                          <div className="text-gray-600 text-xs mt-0.5 flex items-center gap-2">
                            <span>{r.source}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ background: `${r.color}15`, color: r.color }}>#{r.tag}</span>
                          </div>
                        </div>
                        <span className="text-gray-700 text-xs">↗</span>
                      </div>
                    ))}
                    <div className="text-center text-purple-400/60 text-xs py-1">
                      ✦ 3 results for "{searchText}"
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="h-full transition-all"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #ec4899)' }} />
          </div>

          {/* Scene indicators */}
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {['Save', 'Graph', 'Search'].map((label, i) => (
              <div key={label} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ background: currentScene === i ? '#a78bfa' : 'rgba(255,255,255,0.1)' }} />
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-3">
          Auto-playing demo · Click outside or ✕ to close
        </p>
      </div>
    </div>
  )
}

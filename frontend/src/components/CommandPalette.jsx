import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const staticActions = [
  { id: 'dashboard', icon: '⚡', label: 'Go to Dashboard',   shortcut: 'G D', action: 'navigate', to: '/dashboard', group: 'Navigation' },
  { id: 'analytics', icon: '📊', label: 'Go to Analytics',   shortcut: 'G A', action: 'navigate', to: '/analytics',  group: 'Navigation' },
  { id: 'profile',   icon: '👤', label: 'Go to Profile',     shortcut: 'G P', action: 'navigate', to: '/profile',    group: 'Navigation' },
  { id: 'save',      icon: '✦',  label: 'Save new item',     shortcut: 'N',   action: 'save',                        group: 'Actions'    },
  { id: 'graph',     icon: '◎',  label: 'Open Knowledge Graph', shortcut: 'G K', action: 'graph',                   group: 'Actions'    },
  { id: 'brainstorm',icon: '🤖', label: 'Start AI Brainstorm',  shortcut: 'B',   action: 'brainstorm',               group: 'Actions'    },
]

export default function CommandPalette({ items = [], onSave, onClose, isOpen }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // Filter items + static actions
  const filteredItems = query.length > 1
    ? items.filter(i =>
        i.title?.toLowerCase().includes(query.toLowerCase()) ||
        i.summary?.toLowerCase().includes(query.toLowerCase()) ||
        i.tags?.some(t => t.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 5)
    : []

  const filteredActions = staticActions.filter(a =>
    !query || a.label.toLowerCase().includes(query.toLowerCase())
  )

  const allResults = [
    ...filteredActions.map(a => ({ ...a, type: 'action' })),
    ...filteredItems.map(i => ({ ...i, type: 'item', icon: '🧠', group: 'Your Brain' })),
  ]

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => { setSelected(0) }, [query])

  const execute = (result) => {
    onClose()
    if (result.type === 'action') {
      if (result.action === 'navigate') navigate(result.to)
      else if (result.action === 'save') onSave?.()
      else if (result.action === 'graph') navigate('/dashboard?tab=graph')
      else if (result.action === 'brainstorm') navigate('/dashboard?tab=brainstorm')
    } else {
      navigate(`/item/${result.id}`)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, allResults.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && allResults[selected]) execute(allResults[selected])
    if (e.key === 'Escape') onClose()
  }

  if (!isOpen) return null

  // Group results for display
  const groups = {}
  allResults.forEach((r, i) => {
    if (!groups[r.group]) groups[r.group] = []
    groups[r.group].push({ ...r, _index: i })
  })

  return (
    <>
      <style>{`
        @keyframes palette-in {
          from { opacity: 0; transform: translateY(-12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}>

        {/* Palette */}
        <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)',
            border: '1px solid rgba(124,58,237,0.3)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(124,58,237,0.1)',
            animation: 'palette-in 0.25s cubic-bezier(0.22,1,0.36,1) both',
          }}
          onClick={e => e.stopPropagation()}
          onKeyDown={onKeyDown}>

          {/* Search input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
            <span className="text-gray-500 text-lg">⌕</span>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search your brain or jump to..."
              className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm"
            />
            <kbd className="text-gray-700 text-xs border border-white/10 px-2 py-0.5 rounded-md">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto py-2">
            {allResults.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-600 text-sm">
                No results for "<span className="text-gray-500">{query}</span>"
              </div>
            )}

            {Object.entries(groups).map(([group, results]) => (
              <div key={group}>
                <div className="px-5 py-1.5">
                  <span className="text-xs text-gray-700 uppercase tracking-widest font-semibold">{group}</span>
                </div>
                {results.map((result) => (
                  <button key={result.id}
                    onClick={() => execute(result)}
                    onMouseEnter={() => setSelected(result._index)}
                    className="w-full flex items-center gap-3 px-5 py-3 transition-colors text-left"
                    style={{
                      background: selected === result._index ? 'rgba(124,58,237,0.12)' : 'transparent',
                      borderLeft: selected === result._index ? '2px solid rgba(124,58,237,0.6)' : '2px solid transparent',
                    }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {result.icon}
                    </span>
                    <span className="flex-1 text-sm text-gray-200 truncate">{result.label || result.title}</span>
                    {result.shortcut && (
                      <kbd className="text-gray-700 text-xs border border-white/10 px-2 py-0.5 rounded-md shrink-0">{result.shortcut}</kbd>
                    )}
                    {result.type === 'item' && (
                      <span className="text-xs text-gray-700 shrink-0">↗</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/5 flex items-center gap-4 text-xs text-gray-700">
            <span className="flex items-center gap-1.5"><kbd className="border border-white/10 px-1.5 py-0.5 rounded text-xs">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1.5"><kbd className="border border-white/10 px-1.5 py-0.5 rounded text-xs">↵</kbd> open</span>
            <span className="flex items-center gap-1.5"><kbd className="border border-white/10 px-1.5 py-0.5 rounded text-xs">ESC</kbd> close</span>
            <span className="ml-auto flex items-center gap-1">
              <span className="text-purple-400/40">✦</span> Cortex
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

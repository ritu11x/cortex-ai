import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

// ── Time helper ──────────────────────────────────────────────
const timeAgo = (date) => {
  const s = Math.floor((new Date() - new Date(date)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// ── Board Card ───────────────────────────────────────────────
function BoardCard({ board, onOpen, onDelete }) {
  return (
    <div
      onClick={() => onOpen(board)}
      className="group cursor-pointer border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:border-purple-500/30 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)',
        boxShadow: 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 40px rgba(124,58,237,0.15)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'linear-gradient(90deg, transparent, #7c3aed, transparent)' }} />

      {/* Board icon */}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
        <span className="text-2xl">🧠</span>
      </div>

      <h3 className="text-white font-black text-base mb-1 line-clamp-1">{board.name}</h3>
      <p className="text-gray-600 text-xs mb-4 flex items-center gap-2">
        <span>{board.item_ids?.length || 0} items</span>
        <span>·</span>
        <span>{board.messages?.length || 0} messages</span>
      </p>

      <div className="flex items-center justify-between">
        <span className="text-gray-700 text-xs">{timeAgo(board.created_at)}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); onDelete(board) }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100">
            🗑️
          </button>
          <span className="text-purple-400/60 text-xs group-hover:text-purple-400 transition">Open →</span>
        </div>
      </div>
    </div>
  )
}

// ── Board Chat ───────────────────────────────────────────────
function BoardChat({ board, allItems, onClose, onUpdate }) {
  const [messages, setMessages] = useState(board.messages || [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  const boardItems = allItems.filter(i => board.item_ids?.includes(i.id))

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post(`${BACKEND_URL}/api/chat`, {
        message: input,
        items: boardItems.map(i => ({
          title: i.title, summary: i.summary,
          tags: i.tags, category: i.category, content: i.content,
        }))
      })
      const aiMsg = { role: 'assistant', content: res.data.reply }
      const finalMessages = [...newMessages, aiMsg]
      setMessages(finalMessages)

      // Save to Supabase
      await supabase.from('brainstorm_boards').update({
        messages: finalMessages,
        updated_at: new Date().toISOString(),
      }).eq('id', board.id)

      onUpdate({ ...board, messages: finalMessages })
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again!' }])
    }
    setLoading(false)
  }

  const suggestions = [
    'Find connections between these items',
    'Generate a Twitter thread from these',
    'What are the key insights?',
    'Create a content plan based on these',
    'Summarize everything in bullet points',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-3xl h-[85vh] flex flex-col rounded-2xl border border-purple-500/30 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
          <div>
            <h2 className="text-white font-black text-lg flex items-center gap-2">
              <span className="text-purple-400">🧠</span> {board.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-600">Focused on</span>
              {boardItems.slice(0, 3).map(item => (
                <span key={item.id} className="text-xs text-purple-300/60 bg-purple-400/10 border border-purple-400/20 px-2 py-0.5 rounded-full truncate max-w-[100px]">
                  {item.title}
                </span>
              ))}
              {boardItems.length > 3 && <span className="text-xs text-gray-600">+{boardItems.length - 3} more</span>}
            </div>
          </div>
          <button onClick={onClose}
            className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition">✕</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-gray-600 text-sm text-center mb-2">Start brainstorming with your {boardItems.length} selected items</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map(s => (
                  <button key={s} onClick={() => setInput(s)}
                    className="text-xs text-purple-300/70 border border-purple-400/20 bg-purple-400/5 px-3 py-1.5 rounded-full hover:border-purple-400/40 transition">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-sm'
                  : 'border border-white/5 text-gray-200 rounded-bl-sm'
              }`} style={msg.role === 'assistant' ? { background: 'rgba(255,255,255,0.03)' } : {}}>
                {msg.role === 'assistant' && (
                  <span className="text-purple-400 text-xs font-semibold block mb-1">✦ Cortex AI</span>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="border border-white/5 rounded-2xl rounded-bl-sm px-5 py-3"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-purple-400 text-xs font-semibold block mb-1">✦ Cortex AI</span>
                <div className="flex gap-1 items-center py-1">
                  {[0,150,300].map(d => (
                    <div key={d} className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay:`${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-white/5">
          <div className="flex gap-3 items-end">
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }}}
              placeholder="Ask anything about your selected items..."
              rows={2}
              className="flex-1 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:ring-2 ring-purple-500/50 text-sm resize-none"
              style={{ background: 'rgba(255,255,255,0.03)' }} />
            <button onClick={handleSend} disabled={loading || !input.trim()}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 rounded-xl font-semibold transition text-sm h-fit">
              Send →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── New Board Modal ──────────────────────────────────────────
function NewBoardModal({ items, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [loading, setLoading] = useState(false)

  const toggle = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleCreate = async () => {
    if (!name.trim() || selectedIds.size === 0) return
    setLoading(true)
    onCreate(name.trim(), [...selectedIds])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>

        <div className="flex justify-between items-center px-6 py-5 border-b border-white/5">
          <h2 className="text-white font-black text-lg">New Brainstorm Board</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {/* Board name */}
          <div>
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-2">Board Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. AI Research, Content Ideas, Travel Plans..."
              className="w-full border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:ring-2 ring-purple-500/50 text-sm"
              style={{ background: 'rgba(255,255,255,0.03)' }} />
          </div>

          {/* Select items */}
          <div>
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-2">
              Select Items ({selectedIds.size} selected)
            </label>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {items.map(item => (
                <div key={item.id}
                  onClick={() => toggle(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition ${
                    selectedIds.has(item.id)
                      ? 'border-purple-500/40 bg-purple-500/10'
                      : 'border-white/5 hover:border-white/10'
                  }`}
                  style={{ background: selectedIds.has(item.id) ? undefined : 'rgba(255,255,255,0.02)' }}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                    selectedIds.has(item.id) ? 'bg-purple-500 border-purple-500' : 'border-white/30'
                  }`}>
                    {selectedIds.has(item.id) && <span className="text-white text-xs font-black">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{item.title}</p>
                    <p className="text-gray-600 text-xs capitalize">{item.category} · {item.source || item.source_type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/5">
          <button onClick={handleCreate} disabled={!name.trim() || selectedIds.size === 0 || loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition active:scale-95 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            {loading ? 'Creating...' : `✦ Create Board with ${selectedIds.size} items`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function BrainstormBoards({ user }) {
  const navigate = useNavigate()
  const [boards, setBoards] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [activeBoard, setActiveBoard] = useState(null)

  useEffect(() => {
    document.title = 'Brainstorm Boards — Cortex'
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [{ data: boards }, { data: items }] = await Promise.all([
      supabase.from('brainstorm_boards').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
      supabase.from('saved_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setBoards(boards || [])
    setItems(items || [])
    setLoading(false)
  }

  const handleCreate = async (name, itemIds) => {
    const { data, error } = await supabase.from('brainstorm_boards').insert({
      user_id: user.id,
      name,
      item_ids: itemIds,
      messages: [],
    }).select().single()

    if (!error && data) {
      setBoards(prev => [data, ...prev])
      setShowNew(false)
      setActiveBoard(data)
    }
  }

  const handleDelete = async (board) => {
    if (!confirm(`Delete "${board.name}"?`)) return
    await supabase.from('brainstorm_boards').delete().eq('id', board.id)
    setBoards(prev => prev.filter(b => b.id !== board.id))
  }

  const handleUpdate = (updated) => {
    setBoards(prev => prev.map(b => b.id === updated.id ? updated : b))
    setActiveBoard(updated)
  }

  return (
    <div className="bg-[#0a0a0f] min-h-screen text-white">

      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      <div className="fixed top-[-200px] left-[10%] w-[500px] h-[500px] rounded-full z-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Dashboard
            </button>
            <div className="w-px h-4 bg-white/10" />
            <div>
              <h1 className="text-3xl font-black text-white flex items-center gap-2">
                Brainstorm <span className="text-purple-400">Boards</span>
              </h1>
              <p className="text-gray-600 text-sm mt-0.5">Select items and chat with AI to generate content</p>
            </div>
          </div>

          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white transition active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            + New Board
          </button>
        </div>

        {/* Boards grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-2xl p-5 border border-white/5 h-40"
                style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
                <div className="skeleton w-12 h-12 rounded-xl mb-4" />
                <div className="skeleton h-4 w-3/4 mb-2" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
              🧠
            </div>
            <h2 className="text-white font-black text-xl mb-2">No boards yet</h2>
            <p className="text-gray-600 text-sm mb-6">Create a board by selecting items and brainstorming with AI</p>
            <button onClick={() => setShowNew(true)}
              className="px-6 py-3 rounded-2xl font-bold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
              + Create your first board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {boards.map(board => (
              <BoardCard key={board.id} board={board} onOpen={setActiveBoard} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showNew && <NewBoardModal items={items} onClose={() => setShowNew(false)} onCreate={handleCreate} />}
      {activeBoard && (
        <BoardChat
          board={activeBoard}
          allItems={items}
          onClose={() => setActiveBoard(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
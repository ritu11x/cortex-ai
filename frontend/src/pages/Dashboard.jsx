import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import Navbar from '../components/layout/Navbar'
import FeedCard from '../components/feed/FeedCard'
import SaveModal from '../components/save/SaveModal'
import KnowledgeGraph from '../components/graph/KnowledgeGraph'
import BrainChat from '../components/chat/BrainChat'
import PersonalFeed from '../components/feed/PersonalFeed'
import EditModal from '../components/save/EditModal'
import EmptyState from '../components/EmptyState'
import CommandPalette from '../components/CommandPalette'
import ConfettiBurst, { checkMilestone } from '../components/ConfettiBurst'
import { exportToPDF } from '../utils/exportPDF'

const categories = ['all', 'tech', 'health', 'finance', 'travel', 'other']

const categoryColors = {
  all:     'text-white border-white/20 bg-white/5',
  tech:    'text-blue-400 border-blue-400/20 bg-blue-400/5',
  health:  'text-green-400 border-green-400/20 bg-green-400/5',
  finance: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5',
  travel:  'text-pink-400 border-pink-400/20 bg-pink-400/5',
  other:   'text-purple-400 border-purple-400/20 bg-purple-400/5',
}

const sendNotification = (userId, title, message, type = 'info') => {
  supabase.from('notifications').insert({ user_id: userId, title, message, type })
}

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const [showSaveModal, setShowSaveModal]   = useState(false)
  const [showChat, setShowChat]             = useState(false)
  const [showFeed, setShowFeed]             = useState(false)
  const [search, setSearch]                 = useState('')
  const [view, setView]                     = useState('grid')
  const [activeCategory, setActiveCategory] = useState('all')
  const [sharedContent, setSharedContent]   = useState(null)
  const [editItem, setEditItem]             = useState(null)
  const [items, setItems]                   = useState([])
  const [loading, setLoading]               = useState(true)

  // ✅ Cmd+K palette
  const [paletteOpen, setPaletteOpen] = useState(false)

  // ✅ Confetti milestone
  const [milestone, setMilestone]   = useState(null)
  const prevCountRef                = useRef(0)

  // ── Fetch ────────────────────────────────────────────
  const fetchItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('saved_items')
      .select('*')
      .eq('user_id', user.id)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (!error) setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
    const hasWelcomed = sessionStorage.getItem('welcomed')
    if (!hasWelcomed) {
      sessionStorage.setItem('welcomed', 'true')
      sendNotification(user.id, 'Welcome to Cortex! 🧠', 'Start saving links from Instagram, YouTube or Twitter. AI will organize everything for you.', 'ai')
    }
  }, [user])

  // ✅ Cmd+K keyboard shortcut
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(p => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ✅ Check milestone whenever items change
  useEffect(() => {
    if (items.length > 0) {
      const hit = checkMilestone(prevCountRef.current, items.length)
      if (hit) setMilestone(hit)
      prevCountRef.current = items.length
    }
  }, [items.length])

  // ✅ Listen for shares when dashboard is already open (PWA message)
useEffect(() => {
  const handler = (e) => {
    setSharedContent(e.detail)
    setShowSaveModal(true)
  }
  window.addEventListener('cortex:share', handler)
  return () => window.removeEventListener('cortex:share', handler)
}, [])

  // ✅ CHANGE 4 — Handle shared content from bookmarklet (URL params) AND PWA share target (sessionStorage)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const openSave    = params.get('openSave')
    const sharedUrl   = params.get('sharedUrl')
    const sharedTitle = params.get('sharedTitle')
    const sharedNote  = params.get('sharedNote')

    // From bookmarklet — comes via URL params directly
    if (openSave && sharedUrl) {
      setSharedContent({
        url:     sharedUrl,
        title:   sharedTitle || '',
        content: sharedNote  || '',
      })
      setShowSaveModal(true)
      window.history.replaceState({}, '', '/dashboard')
      return
    }

    // From PWA share target — comes via sessionStorage
    const shared = sessionStorage.getItem('sharedContent')
    if (openSave && shared) {
      setSharedContent(JSON.parse(shared))
      setShowSaveModal(true)
      sessionStorage.removeItem('sharedContent')
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [])

  // ── Handlers ─────────────────────────────────────────
  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.title}"?`)) return
    const { error } = await supabase.from('saved_items').delete().eq('id', item.id)
    if (!error) {
      setItems(prev => prev.filter(i => i.id !== item.id))
      sendNotification(user.id, 'Item deleted 🗑️', `"${item.title}" was removed from your Cortex.`, 'warning')
    }
  }

  const handlePin = async (item) => {
    const newPinned = !item.pinned
    const { error } = await supabase.from('saved_items').update({ pinned: newPinned }).eq('id', item.id)
    if (!error) {
      setItems(prev => {
        const updated = prev.map(i => i.id === item.id ? { ...i, pinned: newPinned } : i)
        return [...updated].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
      })
      sendNotification(user.id, newPinned ? 'Item pinned 📌' : 'Item unpinned', `"${item.title}" has been ${newPinned ? 'pinned to the top' : 'unpinned'}.`, newPinned ? 'success' : 'info')
    }
  }

  const handleEditSaved = (updatedItem) => {
    setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i))
    setEditItem(null)
    sendNotification(user.id, 'Item updated ✏️', `"${updatedItem.title}" has been updated.`, 'success')
  }

  const handleExportPDF = () => {
    const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
    exportToPDF(items, rawName)
    sendNotification(user.id, 'Export complete 📤', `${items.length} items exported as PDF.`, 'success')
  }

  // ── Filter ───────────────────────────────────────────
  const filtered = items.filter(item => {
    const matchSearch =
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.summary?.toLowerCase().includes(search.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    const matchCategory = activeCategory === 'all' || item.category === activeCategory
    return matchSearch && matchCategory
  })
  const sortedFiltered = [...filtered].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  // ── Display name ─────────────────────────────────────
  const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
  const firstName = rawName.split(/[\s._\d]/)[0].replace(/[^a-zA-Z]/g, '').toLowerCase()
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const greetingIcon = hour < 12 ? '☀️' : hour < 17 ? '⚡' : '🌙'

  // ── Render ───────────────────────────────────────────
  return (
    <div className="bg-[#0a0a0f] min-h-screen text-white">

      <style>{`
        @keyframes blob-1 {
          0%,100% { border-radius:60% 40% 30% 70%/60% 30% 70% 40%; transform:translate(0,0) scale(1); }
          25%  { border-radius:30% 60% 70% 40%/50% 60% 30% 60%; transform:translate(18px,-12px) scale(1.04); }
          50%  { border-radius:50% 60% 30% 60%/30% 40% 70% 50%; transform:translate(-10px,18px) scale(0.97); }
          75%  { border-radius:70% 30% 60% 40%/40% 70% 30% 60%; transform:translate(12px,8px) scale(1.03); }
        }
        @keyframes blob-2 {
          0%,100% { border-radius:40% 60% 70% 30%/40% 70% 30% 60%; transform:translate(0,0) scale(1); }
          33%  { border-radius:70% 30% 40% 60%/60% 40% 70% 30%; transform:translate(-18px,14px) scale(1.05); }
          66%  { border-radius:30% 70% 60% 40%/70% 30% 50% 60%; transform:translate(10px,-18px) scale(0.96); }
        }
        @keyframes blob-3 {
          0%,100% { border-radius:50% 50% 40% 60%/60% 40% 60% 40%; transform:translate(0,0) scale(1); }
          40%  { border-radius:60% 40% 60% 40%/40% 60% 40% 60%; transform:translate(14px,14px) scale(1.04); }
          80%  { border-radius:40% 60% 50% 50%/50% 50% 60% 40%; transform:translate(-14px,-10px) scale(0.97); }
        }
        @keyframes blob-4 {
          0%,100% { border-radius:65% 35% 50% 50%/45% 55% 45% 55%; transform:translate(0,0) scale(1); }
          50%  { border-radius:35% 65% 40% 60%/60% 40% 65% 35%; transform:translate(10px,-14px) scale(1.05); }
        }
      `}</style>

      {/* Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      {/* Blobs */}
      <div className="fixed z-0 pointer-events-none" style={{ top:'-80px', left:'-80px', width:'260px', height:'260px', background:'linear-gradient(135deg, rgba(124,58,237,0.55), rgba(167,139,250,0.35))', animation:'blob-1 10s ease-in-out infinite', filter:'blur(2px)', opacity:0.6 }} />
      <div className="fixed z-0 pointer-events-none" style={{ bottom:'-70px', right:'-70px', width:'240px', height:'240px', background:'linear-gradient(135deg, rgba(236,72,153,0.50), rgba(244,114,182,0.30))', animation:'blob-2 13s ease-in-out infinite', filter:'blur(2px)', opacity:0.55 }} />
      <div className="fixed z-0 pointer-events-none" style={{ top:'38%', right:'-50px', width:'180px', height:'180px', background:'linear-gradient(135deg, rgba(37,99,235,0.45), rgba(96,165,250,0.28))', animation:'blob-3 9s ease-in-out infinite', filter:'blur(2px)', opacity:0.5 }} />
      <div className="fixed z-0 pointer-events-none" style={{ top:'58%', left:'-40px', width:'160px', height:'160px', background:'linear-gradient(135deg, rgba(52,211,153,0.40), rgba(16,185,129,0.25))', animation:'blob-4 12s ease-in-out infinite', filter:'blur(2px)', opacity:0.45 }} />

      <div className="relative z-10 animate-page-in">

        <Navbar user={user} onSave={() => setShowSaveModal(true)} onOpenChat={() => setShowChat(true)} onOpenGraph={() => setView('graph')} />

        {/* Hero Header */}
        <div className="px-4 md:px-8 pt-6 md:pt-8 pb-6 border-b border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-3 md:gap-5">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl md:text-3xl relative shrink-0"
                  style={{ background:'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.1))', border:'1px solid rgba(124,58,237,0.2)' }}>
                  {greetingIcon}
                  <div className="absolute -top-1 -right-1 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-green-400 border-2 border-[#0a0a0f] animate-pulse" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm md:text-base font-medium mb-0.5 md:mb-1">{greeting} 👋</p>
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">{displayName}</h1>
                    <span className="text-purple-400 text-2xl md:text-4xl font-black">.</span>
                    <span className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-purple-500/20 text-purple-300/70 font-medium hidden sm:block"
                      style={{ background:'rgba(124,58,237,0.08)' }}>
                      ✦ cortex is thinking...
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs md:text-sm mt-1">
                    {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
                  </p>
                </div>
              </div>

              {/* Stats + Cmd+K hint */}
              <div className="flex items-center gap-3">
                <button onClick={() => setPaletteOpen(true)}
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-white/5 text-gray-600 hover:text-gray-300 hover:border-white/10 transition text-xs"
                  style={{ background:'rgba(255,255,255,0.02)' }}>
                  <span>⌕ Search everything</span>
                  <kbd className="border border-white/10 px-1.5 py-0.5 rounded text-xs text-gray-700">⌘K</kbd>
                </button>

                {items.length > 0 && (
                  <div className="border border-white/5 rounded-2xl px-4 md:px-6 py-3 md:py-4 hidden md:flex items-center gap-4 md:gap-6"
                    style={{ background:'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
                    <div className="text-center">
                      <p className="text-2xl md:text-3xl font-black text-purple-400">{items.length}</p>
                      <p className="text-gray-600 text-xs md:text-sm mt-1">ideas saved</p>
                    </div>
                    <div className="w-px h-10 md:h-12 bg-white/5" />
                    <div className="text-center">
                      <p className="text-2xl md:text-3xl font-black text-green-400">
                        {items.filter(i => { const w=new Date(); w.setDate(w.getDate()-7); return new Date(i.created_at)>w }).length}
                      </p>
                      <p className="text-gray-600 text-xs md:text-sm mt-1">this week</p>
                    </div>
                    <div className="w-px h-10 md:h-12 bg-white/5" />
                    <div className="text-center">
                      <p className="text-2xl md:text-3xl font-black text-blue-400">{[...new Set(items.map(i => i.category))].length}</p>
                      <p className="text-gray-600 text-xs md:text-sm mt-1">topics</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile stats */}
            {items.length > 0 && (
              <div className="flex md:hidden gap-3 mb-4">
                {[
                  { value:items.length, label:'saved', color:'text-purple-400' },
                  { value:items.filter(i=>{const w=new Date();w.setDate(w.getDate()-7);return new Date(i.created_at)>w}).length, label:'this week', color:'text-green-400' },
                  { value:[...new Set(items.map(i=>i.category))].length, label:'topics', color:'text-blue-400' },
                ].map(s => (
                  <div key={s.label} className="flex-1 border border-white/5 rounded-xl px-3 py-2 text-center"
                    style={{ background:'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-gray-600 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Motivational bar */}
            <div className="flex items-center gap-2 md:gap-3 px-4 md:px-5 py-3 md:py-4 rounded-2xl border border-white/5"
              style={{ background:'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(236,72,153,0.03))' }}>
              <span className="text-yellow-400 text-base md:text-lg shrink-0">⚡</span>
              <p className="text-gray-400 text-sm md:text-base">
                {items.length === 0 ? 'Your Cortex is waiting — save your first idea!'
                  : items.length < 5 ? `You've saved ${items.length} idea${items.length > 1 ? 's' : ''} — Cortex is learning!`
                  : items.length < 20 ? `${items.length} ideas in Cortex — you're building something great!`
                  : `${items.length} ideas — your Cortex is fully charged! 🧠`}
              </p>
              {items.length > 0 && (
                <div className="ml-auto flex gap-1 md:gap-1.5 shrink-0">
                  {Array.from({ length: Math.min(items.length, 5) }).map((_, i) => (
                    <div key={i} className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-purple-500/40"
                      style={{ opacity: 0.3 + (i/5)*0.7 }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 md:px-8 py-4 md:py-5 max-w-7xl mx-auto">
          <div className="relative mb-3">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">⌕</span>
            <input type="text" placeholder="Search your second brain... (or press ⌘K)" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-white/5 text-white placeholder-gray-600 pl-10 pr-5 py-3 md:py-3.5 rounded-2xl outline-none focus:ring-2 ring-purple-500/30 text-sm md:text-base transition"
              style={{ background:'linear-gradient(135deg, #0f0f1a, #0a0a12)' }} />
          </div>

          <div className="flex gap-2 md:gap-3 items-center overflow-x-auto pb-1 scrollbar-none">
            <button onClick={() => setShowChat(true)}
              className="px-4 md:px-5 py-2.5 md:py-3.5 border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-2xl text-sm md:text-base font-semibold transition flex items-center gap-2 whitespace-nowrap active:scale-95 shrink-0">
              <span className="text-purple-400">✦</span> Brainstorm
            </button>
            <button onClick={() => setShowFeed(true)}
              className="px-4 md:px-5 py-2.5 md:py-3.5 border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 rounded-2xl text-sm md:text-base font-semibold transition flex items-center gap-2 whitespace-nowrap active:scale-95 shrink-0">
              <span className="text-yellow-400">✦</span> My Feed
            </button>
            <button onClick={handleExportPDF}
              className="px-4 md:px-5 py-2.5 md:py-3.5 border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white rounded-2xl text-sm md:text-base font-semibold transition flex items-center gap-2 whitespace-nowrap active:scale-95 shrink-0">
              <span>📤</span> Export
            </button>

            {/* ✅ Bookmarklet install button */}
            <button onClick={() => navigate('/bookmarklet')}
              className="px-4 md:px-5 py-2.5 md:py-3.5 border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white rounded-2xl text-sm md:text-base font-semibold transition flex items-center gap-2 whitespace-nowrap active:scale-95 shrink-0">
              <span>🔖</span> <span className="hidden sm:inline">Browser Button</span>
            </button>

            {/* Cmd+K mobile */}
            <button onClick={() => setPaletteOpen(true)}
              className="md:hidden px-4 py-2.5 border border-white/10 hover:bg-white/5 text-gray-500 rounded-2xl text-sm transition flex items-center gap-2 whitespace-nowrap active:scale-95 shrink-0">
              ⌕ Search
            </button>

            <div className="flex border border-white/10 rounded-2xl p-1 gap-1 shrink-0 ml-auto"
              style={{ background:'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
              {[{ id:'grid', icon:'▦', label:'Grid' }, { id:'graph', icon:'◎', label:'Graph' }].map(v => (
                <button key={v.id} onClick={() => setView(v.id)}
                  className={`px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-sm md:text-base font-medium transition flex items-center gap-1.5 active:scale-95 ${view===v.id ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}>
                  {v.icon} <span className="hidden sm:inline">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-3 md:mt-4 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold border capitalize transition active:scale-95 whitespace-nowrap shrink-0 ${activeCategory===cat ? categoryColors[cat] : 'text-gray-600 border-white/5 hover:border-white/10 hover:text-gray-400'}`}>
                {cat==='all' ? `All (${items.length})` : `${cat} (${items.filter(i=>i.category===cat).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 md:px-8 pb-20 max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl p-5 border border-white/5"
                  style={{ background:'linear-gradient(135deg, #0f0f1a, #0a0a12)', animationDelay:`${i*80}ms` }}>
                  <div className="skeleton h-4 w-24 mb-4 rounded-full" />
                  <div className="skeleton h-6 w-full mb-2" />
                  <div className="skeleton h-6 w-3/4 mb-4" />
                  <div className="skeleton h-4 w-full mb-2" />
                  <div className="skeleton h-4 w-5/6 mb-4" />
                  <div className="flex gap-2 mb-4">
                    <div className="skeleton h-5 w-16 rounded-full" />
                    <div className="skeleton h-5 w-12 rounded-full" />
                  </div>
                  <div className="skeleton h-px w-full mt-2" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState onSave={() => setShowSaveModal(true)} />
          ) : view === 'graph' ? (
            <div className="mt-2 border border-white/5 rounded-2xl overflow-hidden"
              style={{ height:'60vh', background:'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
              {items.length < 2 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-gray-600 text-sm md:text-base">Save at least 2 items to see connections</p>
                </div>
              ) : <KnowledgeGraph items={items} />}
            </div>
          ) : sortedFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 md:py-40 text-center">
              <p className="text-gray-600 text-lg md:text-xl mb-2">No results found</p>
              <p className="text-gray-700 text-sm md:text-base">Try a different search or category</p>
            </div>
          ) : (
            <>
              <p className="text-gray-700 text-xs md:text-sm mb-4 md:mb-5">
                {sortedFiltered.length} items
                {sortedFiltered.filter(i => i.pinned).length > 0 && (
                  <span className="ml-2 text-yellow-400/60">· {sortedFiltered.filter(i => i.pinned).length} pinned</span>
                )}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {sortedFiltered.map((item, idx) => (
                  <FeedCard key={item.id} item={item} index={idx}
                    onClick={() => {}}
                    onDelete={handleDelete}
                    onPin={handlePin}
                    onEdit={item => setEditItem(item)} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showSaveModal && (
        <SaveModal user={user} prefill={sharedContent}
          onClose={() => { setShowSaveModal(false); setSharedContent(null) }}
          onSaved={() => {
            setShowSaveModal(false)
            setSharedContent(null)
            fetchItems()
            sendNotification(user.id, 'Item saved! ✦', 'Your item has been saved and AI is organizing it.', 'success')
          }} />
      )}

      {showChat && <BrainChat items={items} onClose={() => setShowChat(false)} />}
      {showFeed && <PersonalFeed items={items} onClose={() => setShowFeed(false)} />}
      {editItem && <EditModal item={editItem} onClose={() => setEditItem(null)} onSaved={handleEditSaved} />}

      {/* ✅ Command Palette */}
      <CommandPalette
        isOpen={paletteOpen}
        items={items}
        onSave={() => { setPaletteOpen(false); setShowSaveModal(true) }}
        onClose={() => setPaletteOpen(false)}
      />

      {/* ✅ Confetti Milestone */}
      <ConfettiBurst
        milestone={milestone}
        onDone={() => setMilestone(null)}
      />
    </div>
  )
}

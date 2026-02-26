import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'

export default function Analytics() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
useEffect(() => {
  document.title = `Analytics — Cortex`
}, [])
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const { data: itemData } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: true })
      setItems(itemData || [])
      setLoading(false)
    })
  }, [])

  // ── Calculations ──────────────────────────────
  const total = items.length
  const pinned = items.filter(i => i.pinned).length

  const thisWeek = items.filter(i => {
    const w = new Date(); w.setDate(w.getDate() - 7)
    return new Date(i.created_at) > w
  }).length

  const thisMonth = items.filter(i => {
    const m = new Date(); m.setDate(m.getDate() - 30)
    return new Date(i.created_at) > m
  }).length

  // Category breakdown
  const categoryCount = items.reduce((acc, item) => {
    const cat = item.category || 'other'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  // Source breakdown
  const sourceCount = items.reduce((acc, item) => {
    const src = item.source_type || 'link'
    acc[src] = (acc[src] || 0) + 1
    return acc
  }, {})

  // Daily activity last 14 days
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const dateStr = d.toISOString().split('T')[0]
    const count = items.filter(item =>
      item.created_at?.startsWith(dateStr)
    ).length
    return { date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), count }
  })

  const maxCount = Math.max(...last14.map(d => d.count), 1)

  // Top tags
  const tagCount = items.reduce((acc, item) => {
    (item.tags || []).forEach(tag => { acc[tag] = (acc[tag] || 0) + 1 })
    return acc
  }, {})
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Streak calculation
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  let checkDate = new Date()
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0]
    const hasItem = items.some(i => i.created_at?.startsWith(dateStr))
    if (hasItem) { streak++; checkDate.setDate(checkDate.getDate() - 1) }
    else break
  }

  const categoryConfig = {
    tech: { color: '#60a5fa', label: 'Tech' },
    health: { color: '#34d399', label: 'Health' },
    finance: { color: '#fbbf24', label: 'Finance' },
    travel: { color: '#f472b6', label: 'Travel' },
    other: { color: '#a78bfa', label: 'Other' },
  }

  const sourceConfig = {
    instagram: { icon: '◈', color: '#e1306c', label: 'Instagram' },
    youtube: { icon: '▶', color: '#ff4444', label: 'YouTube' },
    twitter: { icon: '𝕏', color: '#1da1f2', label: 'Twitter' },
    whatsapp: { icon: '◉', color: '#25d366', label: 'WhatsApp' },
    link: { icon: '↗', color: '#94a3b8', label: 'Link' },
    note: { icon: '✦', color: '#a78bfa', label: 'Note' },
    text: { icon: '✦', color: '#a78bfa', label: 'Note' },
  }

  if (loading) return (
    <div className="bg-[#0a0a0f] min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin"></div>
    </div>
  )

  return (
    <div className="bg-[#0a0a0f] min-h-screen text-white">

      {/* Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <button onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-4 transition group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Back to Dashboard
            </button>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Analytics<span className="text-purple-400">.</span>
            </h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">Your Cortex usage at a glance</p>
          </div>

          {/* Streak badge */}
          <div className="border border-yellow-500/20 rounded-2xl px-4 py-3 text-center"
            style={{ background: 'rgba(251,191,36,0.06)' }}>
            <p className="text-2xl font-black text-yellow-400">{streak}</p>
            <p className="text-yellow-400/60 text-xs mt-0.5">day streak 🔥</p>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            { label: 'Total Saved', value: total, color: 'text-purple-400', icon: '◎', sub: 'all time' },
            { label: 'This Week', value: thisWeek, color: 'text-green-400', icon: '⚡', sub: 'last 7 days' },
            { label: 'This Month', value: thisMonth, color: 'text-blue-400', icon: '◈', sub: 'last 30 days' },
            { label: 'Pinned', value: pinned, color: 'text-yellow-400', icon: '📌', sub: 'favourites' },
          ].map(stat => (
            <div key={stat.label}
              className="border border-white/5 rounded-2xl p-4 md:p-5"
              style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-lg">{stat.icon}</span>
                <span className="text-gray-700 text-xs">{stat.sub}</span>
              </div>
              <p className={`text-3xl md:text-4xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-gray-500 text-xs md:text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Activity Chart - last 14 days */}
        <div className="border border-white/5 rounded-2xl p-5 md:p-6 mb-6"
          style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
          <h2 className="text-white font-black text-lg mb-6">Activity — Last 14 Days</h2>
          <div className="flex items-end gap-1.5 md:gap-2 h-32 md:h-40">
            {last14.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-xs text-gray-700 opacity-0 group-hover:opacity-100 transition">
                  {day.count}
                </span>
                <div className="w-full rounded-t-lg transition-all duration-300 relative"
                  style={{
                    height: `${Math.max((day.count / maxCount) * 100, day.count > 0 ? 8 : 3)}%`,
                    background: day.count > 0
                      ? 'linear-gradient(180deg, #a78bfa, #7c3aed)'
                      : 'rgba(255,255,255,0.05)',
                    minHeight: '4px'
                  }}>
                  {day.count > 0 && (
                    <div className="absolute inset-0 rounded-t-lg opacity-0 group-hover:opacity-100 transition"
                      style={{ background: 'linear-gradient(180deg, #c4b5fd, #a78bfa)' }} />
                  )}
                </div>
                <span className="text-gray-700 text-[9px] md:text-xs rotate-45 origin-left mt-1 hidden md:block whitespace-nowrap">
                  {day.date}
                </span>
              </div>
            ))}
          </div>
          {/* Mobile date labels */}
          <div className="flex justify-between mt-3 md:hidden">
            <span className="text-gray-700 text-xs">{last14[0]?.date}</span>
            <span className="text-gray-700 text-xs">{last14[6]?.date}</span>
            <span className="text-gray-700 text-xs">{last14[13]?.date}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

          {/* Category Breakdown */}
          <div className="border border-white/5 rounded-2xl p-5 md:p-6"
            style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
            <h2 className="text-white font-black text-lg mb-5">By Category</h2>
            {Object.keys(categoryConfig).map(cat => {
              const count = categoryCount[cat] || 0
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              const cfg = categoryConfig[cat]
              return (
                <div key={cat} className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-gray-300 text-sm font-medium capitalize">{cfg.label}</span>
                    <span className="text-gray-500 text-sm">{count} <span className="text-gray-700">({pct}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: cfg.color }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Source Breakdown */}
          <div className="border border-white/5 rounded-2xl p-5 md:p-6"
            style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
            <h2 className="text-white font-black text-lg mb-5">By Source</h2>
            <div className="flex flex-col gap-3">
              {Object.entries(sourceCount)
                .sort((a, b) => b[1] - a[1])
                .map(([src, count]) => {
                  const cfg = sourceConfig[src] || sourceConfig.link
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={src}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <span style={{ color: cfg.color }}>{cfg.icon}</span>
                          <span className="text-gray-300 text-sm font-medium">{cfg.label}</span>
                        </div>
                        <span className="text-gray-500 text-sm">{count} <span className="text-gray-700">({pct}%)</span></span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                    </div>
                  )
                })}
              {Object.keys(sourceCount).length === 0 && (
                <p className="text-gray-600 text-sm">No items saved yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Tags */}
        {topTags.length > 0 && (
          <div className="border border-white/5 rounded-2xl p-5 md:p-6 mb-6"
            style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
            <h2 className="text-white font-black text-lg mb-5">Top Tags</h2>
            <div className="flex flex-wrap gap-3">
              {topTags.map(([tag, count]) => (
                <div key={tag}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-500/20 transition hover:border-purple-500/40"
                  style={{ background: 'rgba(124,58,237,0.08)' }}>
                  <span className="text-purple-300 text-sm font-semibold">#{tag}</span>
                  <span className="text-purple-400/50 text-xs border border-purple-500/20 px-1.5 py-0.5 rounded-full">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Card */}
        <div className="border border-purple-500/20 rounded-2xl p-5 md:p-6"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.04))' }}>
          <h2 className="text-white font-black text-lg mb-3">✦ Cortex Summary</h2>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            You've saved <span className="text-purple-400 font-bold">{total} ideas</span> in total.
            {thisWeek > 0 && <> This week you added <span className="text-green-400 font-bold">{thisWeek} new items</span>.</>}
            {streak > 1 && <> You're on a <span className="text-yellow-400 font-bold">{streak}-day streak</span> — keep it up!</>}
            {Object.keys(categoryCount).length > 0 && (
              <> Your most active category is <span className="text-blue-400 font-bold capitalize">
                {Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0]}
              </span>.</>
            )}
            {topTags.length > 0 && (
              <> Your most used tag is <span className="text-pink-400 font-bold">#{topTags[0]?.[0]}</span>.</>
            )}
          </p>
        </div>

      </div>
    </div>
  )
}
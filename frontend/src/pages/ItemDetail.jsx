import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

const categoryConfig = {
  tech: { color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', dot: 'bg-blue-400' },
  health: { color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20', dot: 'bg-green-400' },
  finance: { color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', dot: 'bg-yellow-400' },
  travel: { color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/20', dot: 'bg-pink-400' },
  other: { color: 'text-gray-400', bg: 'bg-gray-400/10 border-gray-400/20', dot: 'bg-gray-400' },
}

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItem = async () => {
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('id', id)
        .single()
      if (!error) setItem(data)
      setLoading(false)
    }
    fetchItem()
  }, [id])

  const handleDelete = async () => {
    await supabase.from('saved_items').delete().eq('id', id)
    navigate('/dashboard')
  }

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    return `${Math.floor(seconds / 86400)} days ago`
  }

  if (loading) return (
    <div className="bg-[#0a0a0f] min-h-screen flex items-center justify-center">
      <div className="text-purple-400 text-xl animate-pulse">Loading...</div>
    </div>
  )

  if (!item) return (
    <div className="bg-[#0a0a0f] min-h-screen flex flex-col items-center justify-center text-white">
      <div className="text-5xl mb-4">404</div>
      <p className="text-gray-400 mb-6">Item not found</p>
      <button onClick={() => navigate('/dashboard')}
        className="px-6 py-3 bg-purple-600 rounded-full hover:bg-purple-500 transition">
        Back to Dashboard
      </button>
    </div>
  )

  const config = categoryConfig[item.category] || categoryConfig.other

  return (
    <div className="bg-[#0a0a0f] min-h-screen text-white">

      {/* Grid Background */}
      <div className="fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      {/* Glow */}
      <div className="fixed top-0 left-[30%] w-[500px] h-[500px] rounded-full z-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />

      {/* Top Bar */}
      <div className="relative z-10 flex justify-between items-center px-8 py-5 border-b border-white/5 backdrop-blur-sm">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Back to Dashboard
        </button>

        <div className="text-2xl font-black">
          miles<span className="text-purple-400">.</span>
        </div>

        <button
          onClick={handleDelete}
          className="px-4 py-2 text-sm text-red-400 border border-red-400/20 rounded-full hover:bg-red-400/10 transition"
        >
          Delete item
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-8 py-12">

        {/* Category + Source + Time */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className={`text-sm px-3 py-1.5 rounded-full border font-medium capitalize flex items-center gap-2 ${config.bg} ${config.color}`}>
            <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
            {item.category || 'other'}
          </span>
          <span className="text-sm text-gray-500 border border-white/5 px-3 py-1.5 rounded-full">
            {item.source_type || 'text'}
          </span>
          <span className="text-sm text-gray-600">
            Saved {timeAgo(item.created_at)}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-black leading-tight mb-8 tracking-tight">
          {item.title || 'Untitled'}
        </h1>

        {/* AI Summary Card */}
        {item.summary && (
          <div className="border border-purple-500/20 rounded-2xl p-6 mb-8"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.02))' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-purple-400 text-sm font-semibold tracking-widest uppercase">✦ AI Summary</span>
            </div>
            <p className="text-gray-200 text-lg leading-relaxed">
              {item.summary}
            </p>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/* Original Content - takes 2 cols */}
          {item.content && (
            <div className="md:col-span-2 border border-white/5 rounded-2xl p-6"
              style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
              <p className="text-gray-500 text-xs font-semibold tracking-widest uppercase mb-4">Original Content</p>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {item.content}
              </p>
            </div>
          )}

          {/* Sidebar */}
          <div className="flex flex-col gap-4">

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="border border-white/5 rounded-2xl p-5"
                style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
                <p className="text-gray-500 text-xs font-semibold tracking-widest uppercase mb-4">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <span key={tag}
                      className="text-sm text-purple-300/70 bg-purple-400/5 border border-purple-400/10 px-3 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Meta Info */}
            <div className="border border-white/5 rounded-2xl p-5"
              style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
              <p className="text-gray-500 text-xs font-semibold tracking-widest uppercase mb-4">Details</p>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Category</span>
                  <span className={`capitalize font-medium ${config.color}`}>{item.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="text-gray-300 capitalize">{item.source_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Saved</span>
                  <span className="text-gray-300">{new Date(item.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}</span>
                </div>
              </div>
            </div>

            {/* URL */}
            {item.url && (
              <div className="border border-white/5 rounded-2xl p-5"
                style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
                <p className="text-gray-500 text-xs font-semibold tracking-widest uppercase mb-3">Source Link</p>
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 text-sm break-all transition flex items-start gap-2">
                  <span className="mt-0.5">↗</span>
                  <span>{item.url}</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-4 pt-6 border-t border-white/5">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 border border-white/10 rounded-full text-sm hover:border-white/30 transition"
          >
            ← Back to all items
          </button>
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-full text-sm font-semibold transition">
              Open original ↗
            </a>
          )}
        </div>

      </div>
    </div>
  )
}
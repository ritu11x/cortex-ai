import { useState } from 'react'
import { supabase } from '../../services/supabase'
import axios from 'axios'

const platforms = [
  { id: 'text', label: 'Note', icon: '✦', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  { id: 'instagram', label: 'Instagram', icon: '📸', color: 'text-pink-400', border: 'border-pink-500/30', bg: 'bg-pink-500/10' },
  { id: 'twitter', label: 'Twitter/X', icon: '𝕏', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
  { id: 'youtube', label: 'YouTube', icon: '▶', color: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬', color: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-500/10' },
  { id: 'link', label: 'Any Link', icon: '↗', color: 'text-gray-400', border: 'border-gray-500/30', bg: 'bg-gray-500/10' },
]

const platformGuides = {
  instagram: {
    steps: ['Open Instagram and find the post/reel', 'Tap the share icon (arrow)', 'Copy the link', 'Paste it below'],
    placeholder: 'https://www.instagram.com/p/...',
  },
  twitter: {
    steps: ['Open Twitter/X and find the tweet', 'Click share → Copy link', 'Paste it below'],
    placeholder: 'https://twitter.com/user/status/...',
  },
  youtube: {
    steps: ['Open YouTube video', 'Click Share → Copy link', 'Paste it below'],
    placeholder: 'https://www.youtube.com/watch?v=...',
  },
  whatsapp: {
    steps: ['Open WhatsApp', 'Copy any link sent to you', 'Paste it below'],
    placeholder: 'Paste any link or text from WhatsApp',
  },
}

// ✅ Detect platform from URL
const detectPlatform = (url) => {
  if (!url) return null
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('whatsapp.com')) return 'whatsapp'
  return 'link'
}

// ✅ Fetch URL metadata using YOUR backend
const fetchUrlMeta = async (url) => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/fetch-url`,
      { url },
      { timeout: 10000 }
    )
    return res.data
  } catch {
    return null
  }
}

export default function SaveModal({ user, onClose, onSaved, prefill }) {
  const [type, setType] = useState(prefill?.url ? 'link' : 'text')
  const [title, setTitle] = useState(prefill?.title || '')
  const [content, setContent] = useState(prefill?.content || '')
  const [url, setUrl] = useState(prefill?.url || '')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [fetchSuccess, setFetchSuccess] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [error, setError] = useState('')
  const [showGuide, setShowGuide] = useState(false)

  const selectedPlatform = platforms.find(p => p.id === type)
  const guide = platformGuides[type]

  // ✅ Auto-fetch when URL is pasted
  const handleUrlChange = async (val) => {
    setUrl(val)
    setFetchSuccess(false)
    setFetchError('')
    setThumbnail('')

    const isUrl = /^https?:\/\/.+\..+/.test(val.trim())
    if (!isUrl) return

    // Auto detect platform
    const detected = detectPlatform(val)
    if (detected) setType(detected)

    // Fetch metadata from backend
    setFetching(true)
    const meta = await fetchUrlMeta(val.trim())
    setFetching(false)

    if (meta && !meta.error) {
      if (meta.title && !title) setTitle(meta.title)
      if (meta.description && !content) setContent(meta.description)
      if (meta.image) setThumbnail(meta.image)
      setFetchSuccess(true)
      setTimeout(() => setFetchSuccess(false), 3000)
    } else if (meta?.error) {
      setFetchError('Could not fetch page info — fill manually')
      setTimeout(() => setFetchError(''), 4000)
    }
  }

  const handleSave = async () => {
    if (!content && !url) return setError('Please add some content or URL')
    setLoading(true)
    setError('')

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/items/save`,
        { title, content, url, type, user_id: user.id }
      )
      if (res.data.error) throw new Error(res.data.error)
      onSaved()
    } catch (err) {
      // Fallback: save directly to Supabase
      const { error: dbError } = await supabase.from('saved_items').insert({
        user_id: user.id,
        title: title || url || 'Untitled',
        content,
        url,
        source_type: type,
        tags: [type],
        category: 'other',
        summary: content?.slice(0, 150) || url,
      })
      if (dbError) setError(dbError.message)
      else onSaved()
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-backdrop-in">
      <div className="w-full max-w-xl border border-white/10 rounded-2xl overflow-hidden animate-modal-in"
        style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-white/5">
          <h2 className="text-white font-black text-lg">Save to your Brain</h2>
          <button onClick={onClose}
            className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition">✕</button>
        </div>

        {/* Platform Selector */}
        <div className="px-6 pt-5">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Source</p>
          <div className="grid grid-cols-3 gap-2">
            {platforms.map(p => (
              <button key={p.id}
                onClick={() => {
                  setType(p.id)
                  setShowGuide(false)
                  setUrl('')
                  setContent('')
                  setTitle('')
                  setThumbnail('')
                  setFetchSuccess(false)
                  setFetchError('')
                }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                  type === p.id
                    ? `${p.bg} ${p.border} ${p.color}`
                    : 'border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-300'
                }`}>
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* How to guide */}
        {guide && (
          <div className="px-6 pt-4">
            <button onClick={() => setShowGuide(!showGuide)}
              className="text-xs text-purple-400/70 hover:text-purple-400 transition flex items-center gap-1">
              {showGuide ? '↑ Hide guide' : `↓ How to save from ${selectedPlatform?.label}`}
            </button>
            {showGuide && (
              <div className="mt-3 border border-white/5 rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Steps</p>
                <div className="flex flex-col gap-2">
                  {guide.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-purple-400 font-black text-xs mt-0.5 w-4 shrink-0">{i + 1}.</span>
                      <span className="text-gray-300 text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input Fields */}
        <div className="px-6 pt-4 pb-6 flex flex-col gap-3">

          {/* ✅ URL field with auto-fetch */}
          {type !== 'text' && (
            <div className="relative">
              <input
                type="url"
                placeholder={guide?.placeholder || 'Paste any URL — title & thumbnail auto-fetched ✨'}
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full border text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:ring-2 ring-purple-500/50 text-sm pr-12 transition"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: fetchSuccess
                    ? 'rgba(52,211,153,0.5)'
                    : fetching
                    ? 'rgba(167,139,250,0.4)'
                    : fetchError
                    ? 'rgba(248,113,113,0.4)'
                    : 'rgba(255,255,255,0.05)'
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {fetching && (
                  <div className="w-5 h-5 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
                )}
                {fetchSuccess && !fetching && (
                  <span className="text-green-400 text-lg">✓</span>
                )}
                {fetchError && !fetching && (
                  <span className="text-red-400 text-lg">!</span>
                )}
              </div>
            </div>
          )}

          {/* ✅ Status messages */}
          {fetching && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-500/20 bg-purple-500/5">
              <div className="w-3 h-3 rounded-full border border-purple-500/30 border-t-purple-500 animate-spin shrink-0" />
              <span className="text-purple-400 text-xs">Fetching page info automatically...</span>
            </div>
          )}
          {fetchSuccess && !fetching && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-500/20 bg-green-500/5">
              <span className="text-green-400 text-xs font-bold">✓</span>
              <span className="text-green-400 text-xs font-medium">Title & description fetched automatically!</span>
            </div>
          )}
          {fetchError && !fetching && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/5">
              <span className="text-red-400 text-xs">!</span>
              <span className="text-red-400 text-xs">{fetchError}</span>
            </div>
          )}

          {/* ✅ Thumbnail preview */}
          {thumbnail && (
            <div className="relative rounded-xl overflow-hidden border border-white/5" style={{ height: '140px' }}>
              <img src={thumbnail} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-3">
                <span className="text-xs text-white/60 bg-black/40 px-2 py-0.5 rounded-full">Preview thumbnail</span>
              </div>
              <button onClick={() => setThumbnail('')}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white/60 hover:text-white text-xs transition">
                ✕
              </button>
            </div>
          )}

          {/* Title */}
          <input
            type="text"
            placeholder="Title (optional — AI will generate one)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-white/5 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:ring-2 ring-purple-500/50 text-sm transition"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          />

          {/* Content */}
          <textarea
            placeholder={
              type === 'text' ? 'Write your note or idea here...' :
              type === 'whatsapp' ? 'Paste text from WhatsApp here...' :
              'Add your thoughts about this (optional)...'
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full border border-white/5 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:ring-2 ring-purple-500/50 text-sm resize-none transition"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Platform indicator */}
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${selectedPlatform?.border} ${selectedPlatform?.bg}`}>
            <span>{selectedPlatform?.icon}</span>
            <span className={selectedPlatform?.color}>
              Saving from {selectedPlatform?.label} · AI will auto-summarize and tag
            </span>
          </div>

          <button
            onClick={handleSave}
            disabled={loading || fetching}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl font-bold transition text-sm active:scale-95">
            {loading ? '🤖 AI is processing...' : fetching ? '⏳ Fetching URL...' : `Save from ${selectedPlatform?.label} →`}
          </button>
        </div>
      </div>
    </div>
  )
}

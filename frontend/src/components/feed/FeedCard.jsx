import { useState } from 'react'

const categoryConfig = {
  tech:    { color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20',    dot: 'bg-blue-400',   glow: 'rgba(96,165,250,0.15)',   accent: '#60a5fa' },
  health:  { color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/20',  dot: 'bg-green-400',  glow: 'rgba(52,211,153,0.15)',   accent: '#34d399' },
  finance: { color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20',dot: 'bg-yellow-400', glow: 'rgba(251,191,36,0.15)',   accent: '#fbbf24' },
  travel:  { color: 'text-pink-400',   bg: 'bg-pink-400/10 border-pink-400/20',    dot: 'bg-pink-400',   glow: 'rgba(244,114,182,0.15)',  accent: '#f472b6' },
  other:   { color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20',dot: 'bg-purple-400', glow: 'rgba(167,139,250,0.15)',  accent: '#a78bfa' },
}

const sourceConfig = {
  text:      { icon: '✦', label: 'Note',      color: 'text-purple-400' },
  note:      { icon: '✦', label: 'Note',      color: 'text-purple-400' },
  link:      { icon: '↗', label: 'Link',      color: 'text-gray-400'   },
  instagram: { icon: '📸', label: 'Instagram', color: 'text-pink-400'  },
  twitter:   { icon: '𝕏', label: 'Twitter',   color: 'text-blue-400'  },
  youtube:   { icon: '▶', label: 'YouTube',   color: 'text-red-400'   },
  whatsapp:  { icon: '💬', label: 'WhatsApp',  color: 'text-green-400' },
}

const getYoutubeThumbnail = (url) => {
  if (!url) return null
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null
}

const cleanUrl = (url) => {
  if (!url) return ''
  return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
}

const timeAgo = (date) => {
  const s = Math.floor((new Date() - new Date(date)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function FeedCard({ item, onClick, onDelete, onPin, onEdit, index = 0 }) {
  const [showMenu, setShowMenu] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [imgError, setImgError] = useState(false)

  const config = categoryConfig[(item.category || 'other').toLowerCase()] || categoryConfig.other
  const source = sourceConfig[item.source_type] || sourceConfig.link

  const ytThumb = getYoutubeThumbnail(item.url)
  const thumbnail = !imgError && (ytThumb || item.image || item.thumbnail || null)
  const summary = item.summary && !item.summary.startsWith('http') ? item.summary : null

  return (
    <>
      <style>{`
        .flip-card { perspective: 1200px; }
        .flip-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
          transform-style: preserve-3d;
        }
        .flip-card.flipped .flip-inner { transform: rotateY(180deg); }
        .flip-front, .flip-back {
          position: absolute; inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 1rem;
          overflow: hidden;
        }
        .flip-back { transform: rotateY(180deg); }
        .flip-card { min-height: 280px; }
      `}</style>

      <div
        className={`flip-card animate-card ${flipped ? 'flipped' : ''}`}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="flip-inner">

          {/* ── FRONT FACE ── */}
          <div className="flip-front group cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)',
              border: '1px solid rgba(255,255,255,0.05)',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            }}
            onClick={() => onClick?.(item)}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'
              e.currentTarget.style.boxShadow = `0 8px 40px ${config.glow}`
              e.currentTarget.style.transform = 'translateY(-3px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'translateY(0)'
            }}>

            {/* Accent line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `linear-gradient(90deg, transparent, ${config.accent}, transparent)` }} />

            {/* Thumbnail */}
            {thumbnail && (
              <div className="relative w-full overflow-hidden" style={{ height: '160px' }}>
                <img src={thumbnail} alt={item.title} onError={() => setImgError(true)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 backdrop-blur-sm ${source.color}`}
                    style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {source.icon} {source.label}
                  </span>
                </div>
                {item.pinned && (
                  <div className="absolute top-3 right-3">
                    <span className="text-xs text-yellow-400 px-2 py-1 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(251,191,36,0.3)' }}>📌</span>
                  </div>
                )}
              </div>
            )}

            {/* ··· Menu */}
            <div className="absolute z-20 right-3" style={{ top: thumbnail ? '175px' : '12px' }}
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 text-lg">
                ···
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-9 z-20 w-44 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                    style={{ background: '#0f0f1a' }}>
                    <button onClick={() => { onPin?.(item); setShowMenu(false) }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 transition text-left">
                      📌 {item.pinned ? 'Unpin' : 'Pin to top'}
                    </button>
                    <button onClick={() => { onEdit?.(item); setShowMenu(false) }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 transition text-left">
                      ✏️ Edit
                    </button>
                    <div className="border-t border-white/5" />
                    <button onClick={() => { onDelete?.(item); setShowMenu(false) }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition text-left">
                      🗑️ Delete
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="p-5">
              {/* Badges */}
              {!thumbnail && (
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {item.pinned && (
                    <span className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-1 rounded-full">📌 Pinned</span>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize flex items-center gap-1.5 ${config.bg} ${config.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                    {item.category || 'other'}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border border-white/5 flex items-center gap-1.5 ${source.color}`}
                    style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {source.icon} {source.label}
                  </span>
                </div>
              )}
              {thumbnail && (
                <div className="flex items-center gap-2 mb-3 mt-1">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize flex items-center gap-1.5 ${config.bg} ${config.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                    {item.category || 'other'}
                  </span>
                </div>
              )}

              <h3 className="text-white font-black text-lg leading-snug mb-2 tracking-tight line-clamp-2 group-hover:text-purple-100 transition-colors">
                {item.title || 'Untitled'}
              </h3>

              {summary && (
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-3">{summary}</p>
              )}

              {item.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {item.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs text-purple-300/50 bg-purple-400/5 border border-purple-400/10 px-2 py-0.5 rounded-full">#{tag}</span>
                  ))}
                  {item.tags.length > 3 && <span className="text-xs text-gray-700 px-1">+{item.tags.length - 3}</span>}
                </div>
              )}

              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-purple-400 mb-3 transition-colors">
                  <span>↗</span><span>{cleanUrl(item.url)}</span>
                </a>
              )}

              {/* Bottom row with flip hint */}
              <div className="flex justify-between items-center pt-3 border-t border-white/[0.04]">
                <span className="text-xs text-gray-700">{timeAgo(item.created_at)}</span>
                {/* ✅ Flip button */}
                <button
                  onClick={e => { e.stopPropagation(); setFlipped(true) }}
                  className="flex items-center gap-1 text-xs text-gray-700 hover:text-purple-400 transition-colors group/flip"
                  title="See AI Summary">
                  <span className="group-hover/flip:rotate-180 transition-transform duration-300 inline-block">✦</span>
                  <span>AI Summary</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── BACK FACE — AI Summary ── */}
          <div className="flip-back flex flex-col p-5"
            style={{
              background: 'linear-gradient(135deg, #0f0f1a, #0d0d1e)',
              border: '1px solid rgba(124,58,237,0.3)',
              boxShadow: '0 0 40px rgba(124,58,237,0.1)',
            }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}>
                  <span className="text-purple-400 text-xs">✦</span>
                </div>
                <span className="text-purple-400 text-xs font-bold tracking-wide uppercase">AI Summary</span>
              </div>
              {/* Flip back button */}
              <button
                onClick={e => { e.stopPropagation(); setFlipped(false) }}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition text-xs">
                ↩
              </button>
            </div>

            {/* Title */}
            <h3 className="text-white font-black text-base leading-snug mb-3 tracking-tight line-clamp-2">
              {item.title || 'Untitled'}
            </h3>

            {/* Summary content */}
            <div className="flex-1 border border-purple-500/10 rounded-xl p-4 mb-4"
              style={{ background: 'rgba(124,58,237,0.05)' }}>
              {summary ? (
                <p className="text-gray-300 text-sm leading-relaxed">{summary}</p>
              ) : (
                <p className="text-gray-600 text-sm italic">No AI summary yet — this item was saved before AI processing was enabled.</p>
              )}
            </div>

            {/* Tags */}
            {item.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {item.tags.map(tag => (
                  <span key={tag} className="text-xs text-purple-300/60 bg-purple-400/5 border border-purple-400/15 px-2 py-0.5 rounded-full">#{tag}</span>
                ))}
              </div>
            )}

            {/* Source + time */}
            <div className="flex justify-between items-center pt-3 border-t border-white/[0.04]">
              <span className={`text-xs flex items-center gap-1 ${source.color}`}>
                {source.icon} {source.label}
              </span>
              <span className="text-xs text-gray-700">{timeAgo(item.created_at)}</span>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

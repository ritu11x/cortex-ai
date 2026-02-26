import { useState } from 'react'
import axios from 'axios'

const feedFormats = [
  { id: 'thread', label: 'Twitter Thread', icon: '𝕏', color: '#1da1f2', bg: '#1a2a3a', desc: 'Ready to post thread' },
  { id: 'newsletter', label: 'Newsletter', icon: '◎', color: '#a78bfa', bg: '#2a1a3a', desc: 'Weekly digest format' },
  { id: 'podcast', label: 'Podcast Script', icon: '◉', color: '#f59e0b', bg: '#3a2e1a', desc: '15min deep dive' },
  { id: 'summary', label: '60s Explainer', icon: '✦', color: '#34d399', bg: '#1a3a2e', desc: 'Quick read format' },
]

export default function PersonalFeed({ items, onClose }) {
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedFormat, setSelectedFormat] = useState(null)
  const [generated, setGenerated] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Get all unique tags from saved items
  const allTags = [...new Set(items.flatMap(i => i.tags || []))].slice(0, 8)
  const allCategories = [...new Set(items.map(i => i.category))]

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
    setGenerated(null)
  }

  const handleGenerate = async () => {
    if (!selectedFormat) return setError('Pick a format first!')
    setLoading(true)
    setError('')
    setGenerated(null)

    const relevantItems = selectedTags.length > 0
      ? items.filter(i => i.tags?.some(t => selectedTags.includes(t)) || selectedTags.includes(i.category))
      : items.slice(0, 5)

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat`,
        {
          message: `Generate a ${selectedFormat.label} based on my saved content. 
Format: ${selectedFormat.id}
${selectedFormat.id === 'thread' ? 'Write 5-7 tweets numbered 1/, 2/, etc. Make it engaging and shareable.' : ''}
${selectedFormat.id === 'newsletter' ? 'Write a short newsletter with sections: Intro, Key Insights, Top Picks, Closing.' : ''}
${selectedFormat.id === 'podcast' ? 'Write a podcast script with: Hook, Main Points, Examples, Outro. Conversational tone.' : ''}
${selectedFormat.id === 'summary' ? 'Write a 60-second read. Punchy. Clear. Use bullet points.' : ''}
Based on topics: ${selectedTags.length > 0 ? selectedTags.join(', ') : 'all my saved content'}`,
          items: relevantItems.map(i => ({
            title: i.title,
            summary: i.summary,
            tags: i.tags,
            category: i.category,
            content: i.content,
          }))
        }
      )
      setGenerated(res.data.reply)
    } catch (err) {
      setError('Backend error — make sure it is running!')
    }
    setLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generated)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>

      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>

        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-white/5"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), transparent)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-400">✦</span>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold">AI Content Generator</p>
            </div>
            <h2 className="text-white font-black text-2xl tracking-tight">Your Cortex Feed
</h2>
            <p className="text-gray-500 text-sm mt-1">Turn your saved content into formats you love</p>
          </div>
          <button onClick={onClose}
            className="text-gray-500 hover:text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition text-lg">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 flex flex-col gap-8">

            {/* Step 1 - Pick Topics */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-black">1</div>
                <p className="text-white font-bold text-base">Pick your topics</p>
                <span className="text-gray-600 text-sm">(optional — leave empty for all)</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Category chips */}
                {allCategories.map(cat => (
                  <button key={cat}
                    onClick={() => toggleTag(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border capitalize transition active:scale-95 ${
                      selectedTags.includes(cat)
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'
                    }`}>
                    {cat}
                  </button>
                ))}

                {/* Tag chips */}
                {allTags.map(tag => (
                  <button key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition active:scale-95 ${
                      selectedTags.includes(tag)
                        ? 'bg-purple-500/20 border-purple-400/40 text-purple-300'
                        : 'border-white/5 text-gray-600 hover:border-white/10 hover:text-gray-400'
                    }`}>
                    #{tag}
                  </button>
                ))}

                {allTags.length === 0 && allCategories.length === 0 && (
                  <p className="text-gray-600 text-sm">Save more items to get topic filters</p>
                )}
              </div>
            </div>

            {/* Step 2 - Pick Format */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-black">2</div>
                <p className="text-white font-bold text-base">Choose a format</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {feedFormats.map(fmt => (
                  <button key={fmt.id}
                    onClick={() => { setSelectedFormat(fmt); setGenerated(null) }}
                    className={`flex flex-col items-start p-4 rounded-2xl border transition-all duration-200 active:scale-95 text-left ${
                      selectedFormat?.id === fmt.id
                        ? 'border-purple-500/50 bg-purple-500/10'
                        : 'border-white/5 hover:border-white/10'
                    }`}
                    style={{ background: selectedFormat?.id === fmt.id ? undefined : fmt.bg + '40' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                      style={{ background: fmt.bg, border: `1px solid ${fmt.color}30` }}>
                      <span style={{ color: fmt.color }}>{fmt.icon}</span>
                    </div>
                    <p className="text-white font-bold text-sm mb-1">{fmt.label}</p>
                    <p className="text-gray-600 text-xs">{fmt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !selectedFormat}
              className="w-full py-4 rounded-2xl font-black text-base transition-all duration-200 active:scale-95 disabled:opacity-30 relative overflow-hidden group"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)' }} />
              <span className="relative z-10">
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    Generating your {selectedFormat?.label}...
                  </span>
                ) : `✦ Generate ${selectedFormat?.label || 'Content'} →`}
              </span>
            </button>

            {error && (
              <div className="border border-red-500/20 bg-red-500/5 rounded-xl px-5 py-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Generated Content */}
            {generated && (
              <div className="border border-purple-500/20 rounded-2xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.05), transparent)' }}>

                {/* Output Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: selectedFormat?.bg, border: `1px solid ${selectedFormat?.color}30` }}>
                      <span style={{ color: selectedFormat?.color }} className="text-sm">{selectedFormat?.icon}</span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{selectedFormat?.label}</p>
                      <p className="text-gray-600 text-xs">
                        Based on: {selectedTags.length > 0 ? selectedTags.join(', ') : 'all your content'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleGenerate}
                      className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm transition">
                      ↺ Regenerate
                    </button>
                    <button onClick={handleCopy}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition active:scale-95">
                      Copy ↗
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                  <pre className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {generated}
                  </pre>
                </div>

                {/* From badge */}
                <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-white/5">
                  <span className="text-purple-400 text-xs">✦</span>
                  <p className="text-gray-600 text-xs">Generated from your saved content by Cortex AI</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
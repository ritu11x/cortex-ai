import { useState } from 'react'
import { supabase } from '../../services/supabase'

export default function EditModal({ item, onClose, onSaved }) {
  const [title, setTitle] = useState(item.title || '')
  const [summary, setSummary] = useState(item.summary || '')
  const [tags, setTags] = useState((item.tags || []).join(', '))
  const [category, setCategory] = useState(item.category || 'Other')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('saved_items')
      .update({
        title,
        summary,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        category,
      })
      .eq('id', item.id)

    if (!error) onSaved({ ...item, title, summary, tags: tags.split(',').map(t => t.trim()), category })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-lg border border-white/10 rounded-2xl overflow-hidden"
        style={{ background: '#0f0f1a' }}>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-white/5">
          <h2 className="text-white font-black text-xl">Edit Item</h2>
          <button onClick={onClose}
            className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-4">

          <div>
            <label className="text-gray-400 text-sm font-medium block mb-1.5">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 ring-purple-500/40 text-sm"
              style={{ background: 'rgba(255,255,255,0.03)' }} />
          </div>

          <div>
            <label className="text-gray-400 text-sm font-medium block mb-1.5">Summary</label>
            <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={4}
              className="w-full border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 ring-purple-500/40 text-sm resize-none"
              style={{ background: 'rgba(255,255,255,0.03)' }} />
          </div>

          <div>
            <label className="text-gray-400 text-sm font-medium block mb-1.5">Tags <span className="text-gray-600">(comma separated)</span></label>
            <input value={tags} onChange={e => setTags(e.target.value)}
              placeholder="ai, productivity, learning"
              className="w-full border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 ring-purple-500/40 text-sm"
              style={{ background: 'rgba(255,255,255,0.03)' }} />
          </div>

          <div>
            <label className="text-gray-400 text-sm font-medium block mb-1.5">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 ring-purple-500/40 text-sm"
              style={{ background: '#0f0f1a' }}>
              {['Tech', 'Health', 'Finance', 'Travel', 'Other'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 mt-2">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm font-semibold transition">
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition active:scale-95 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
 
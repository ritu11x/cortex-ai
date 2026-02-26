import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl transition-transform hover:scale-110"
        >
          <span className={star <= (hovered || value) ? 'text-yellow-400' : 'text-gray-700'}>★</span>
        </button>
      ))}
    </div>
  )
}

function ReviewModal({ onClose, onSubmitted }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [review, setReview] = useState('')
  const [stars, setStars] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !review) return setError('Name and review are required!')
    if (review.length < 20) return setError('Review must be at least 20 characters')
    setLoading(true)
    setError('')

    const { error: dbError } = await supabase.from('reviews').insert({
      name, role, review, stars
    })

    if (dbError) setError(dbError.message)
    else onSubmitted()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-lg border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-white/5"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), transparent)' }}>
          <div>
            <h2 className="text-white font-black text-xl">Share your experience</h2>
            <p className="text-gray-500 text-sm mt-0.5">Help others discover Cortex</p>
          </div>
          <button onClick={onClose}
            className="text-gray-500 hover:text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">

          {/* Star Rating */}
          <div>
            <label className="text-gray-400 text-sm font-medium block mb-2">Your Rating</label>
            <StarPicker value={stars} onChange={setStars} />
          </div>

          {/* Name */}
          <div>
            <label className="text-gray-400 text-sm font-medium block mb-1.5">Your Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              placeholder="Arjun Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:ring-2 ring-purple-500/40 text-sm transition"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-gray-400 text-sm font-medium block mb-1.5">Your Role <span className="text-gray-600">(optional)</span></label>
            <input
              type="text"
              placeholder="Content Creator, Student, Developer..."
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:ring-2 ring-purple-500/40 text-sm transition"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            />
          </div>

          {/* Review */}
          <div>
            <label className="text-gray-400 text-sm font-medium block mb-1.5">Your Review <span className="text-red-400">*</span></label>
            <textarea
              placeholder="Tell us how Cortex has helped you..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              className="w-full border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:ring-2 ring-purple-500/40 text-sm transition resize-none"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            />
            <p className="text-gray-700 text-xs mt-1">{review.length}/300 characters</p>
          </div>

          {error && (
            <div className="border border-red-500/20 bg-red-500/5 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-40 relative overflow-hidden group"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)' }} />
            <span className="relative z-10">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  Submitting...
                </span>
              ) : 'Submit Review →'}
            </span>
          </button>
        </form>
      </div>
    </div>
  )
}

const avatarColors = ['#7c3aed', '#ec4899', '#2563eb', '#059669', '#d97706', '#dc2626']

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function getColor(name) {
  let hash = 0
  for (let c of name) hash += c.charCodeAt(0)
  return avatarColors[hash % avatarColors.length]
}

export default function ReviewSection({ onSignup }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(6)
    setReviews(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchReviews() }, [])

  const handleSubmitted = () => {
    setShowModal(false)
    setSubmitted(true)
    fetchReviews()
    setTimeout(() => setSubmitted(false), 4000)
  }

  return (
    <div id="reviews" className="relative z-10 px-10 py-24 border-t border-white/5">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
          <div>
            <p className="text-purple-400 text-sm font-semibold tracking-widest uppercase mb-3">Reviews</p>
            <h2 className="text-5xl font-black tracking-tight">Loved by creators</h2>
          </div>

          {/* Write Review Button */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-3 px-6 py-3.5 border border-purple-500/30 rounded-2xl font-semibold text-base transition-all active:scale-95 group relative overflow-hidden"
            style={{ background: 'rgba(124,58,237,0.08)' }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), transparent)' }} />
            <span className="text-purple-400 text-lg relative z-10">★</span>
            <span className="text-purple-300 relative z-10">Write a Review</span>
          </button>
        </div>

        {/* Success Message */}
        {submitted && (
          <div className="mb-8 border border-green-500/20 bg-green-500/5 rounded-2xl px-6 py-4 flex items-center gap-3">
            <span className="text-green-400 text-xl">✓</span>
            <p className="text-green-400 font-semibold">Thank you! Your review is now live.</p>
          </div>
        )}

        {/* Reviews Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 border border-white/5 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
            <p className="text-6xl mb-4">★</p>
            <h3 className="text-white font-black text-2xl mb-2">Be the first to review!</h3>
            <p className="text-gray-500 mb-8">Share your experience with Cortex</p>
            <button onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-full font-semibold transition active:scale-95">
              Write a Review →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reviews.map((r) => (
              <div key={r.id}
                className="border border-white/5 rounded-2xl p-6 hover:border-purple-500/20 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>

                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-base ${i < r.stars ? 'text-yellow-400' : 'text-gray-700'}`}>★</span>
                  ))}
                </div>

                {/* Review */}
                <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-4">
                  "{r.review}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                    style={{ background: `linear-gradient(135deg, ${getColor(r.name)}, ${getColor(r.name)}88)` }}>
                    {getInitials(r.name)}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{r.name}</p>
                    <p className="text-gray-600 text-xs">{r.role || 'Cortex User'}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs text-gray-700">
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total count */}
        {reviews.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-gray-600 text-sm">{reviews.length} review{reviews.length > 1 ? 's' : ''} from real users</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ReviewModal
          onClose={() => setShowModal(false)}
          onSubmitted={handleSubmitted}
        />
      )}
    </div>
  )
}
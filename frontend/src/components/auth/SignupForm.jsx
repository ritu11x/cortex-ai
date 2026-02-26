 import { useState } from 'react'
import { supabase } from '../../services/supabase'

export default function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        }
      }
    })

    if (error) setError(error.message)
    else setSuccess(true)
    setLoading(false)
  }

  if (success) return (
    <div className="text-center text-white py-6">
      <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
        <span className="text-green-400 text-2xl">✓</span>
      </div>
      <h2 className="text-2xl font-black mb-2">Check your email!</h2>
      <p className="text-gray-400">We sent a confirmation link to</p>
      <p className="text-purple-400 font-semibold mt-1">{email}</p>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white mb-1">
          Join Cortex<span className="text-purple-400">.</span>
        </h2>
        <p className="text-gray-500">Your AI second brain awaits</p>
      </div>

      {error && (
        <div className="border border-red-500/20 bg-red-500/5 rounded-xl px-4 py-3 text-red-400 text-sm mb-5">
          {error}
        </div>
      )}


      {/* OAuth */}
<div className="flex flex-col gap-3 mb-6">
  <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' } })}
    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 hover:border-white/20 text-white text-sm font-semibold transition-all active:scale-95"
    style={{ background: 'rgba(255,255,255,0.03)' }}>
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
    Continue with Google
  </button>
</div>

{/* Divider */}
<div className="flex items-center gap-3 mb-6">
  <div className="flex-1 h-px bg-white/5"></div>
  <span className="text-gray-700 text-xs">or sign up with email</span>
  <div className="flex-1 h-px bg-white/5"></div>
</div>
      <form onSubmit={handleSignup} className="flex flex-col gap-4">

        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-gray-400 text-sm font-medium">Full Name <span className="text-gray-600">(optional)</span></label>
          <input
            type="text"
            placeholder="Vishwa Karmaritu"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-white/10 text-white placeholder-gray-600 px-4 py-3.5 rounded-xl outline-none focus:ring-2 ring-purple-500/40 text-base transition"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-gray-400 text-sm font-medium">Email Address <span className="text-red-400">*</span></label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-white/10 text-white placeholder-gray-600 px-4 py-3.5 rounded-xl outline-none focus:ring-2 ring-purple-500/40 text-base transition"
            style={{ background: 'rgba(255,255,255,0.03)' }}
            required
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-gray-400 text-sm font-medium">Phone <span className="text-gray-600">(optional)</span></label>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 py-3.5 border border-white/10 rounded-xl text-gray-400 text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span>🇮🇳</span>
              <span>+91</span>
            </div>
            <input
              type="tel"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 border border-white/10 text-white placeholder-gray-600 px-4 py-3.5 rounded-xl outline-none focus:ring-2 ring-purple-500/40 text-base transition"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-gray-400 text-sm font-medium">Password <span className="text-red-400">*</span></label>
          <input
            type="password"
            placeholder="Min 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-white/10 text-white placeholder-gray-600 px-4 py-3.5 rounded-xl outline-none focus:ring-2 ring-purple-500/40 text-base transition"
            style={{ background: 'rgba(255,255,255,0.03)' }}
            required
            minLength={6}
          />
        </div>

        {/* What will you use it for */}
        <div className="flex flex-col gap-1.5">
          <label className="text-gray-400 text-sm font-medium">What will you use Cortex for? <span className="text-gray-600">(optional)</span></label>
          <textarea
            placeholder="Save Instagram reels, YouTube videos, research..."
            rows={3}
            className="w-full border border-white/10 text-white placeholder-gray-600 px-4 py-3.5 rounded-xl outline-none focus:ring-2 ring-purple-500/40 text-base transition resize-none"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-black text-lg transition-all duration-200 active:scale-95 disabled:opacity-40 relative overflow-hidden group mt-2"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)' }} />
          <span className="relative z-10">
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                Creating your Cortex...
              </span>
            ) : 'Join Cortex →'}
          </span>
        </button>

        {/* Terms */}
        <p className="text-gray-600 text-xs text-center leading-relaxed">
          By joining, you agree to our Terms of Service and Privacy Policy.
          <br />We'll never spam you.
        </p>
      </form>
    </div>
  )
}
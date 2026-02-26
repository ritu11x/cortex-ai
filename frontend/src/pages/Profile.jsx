import { useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [itemCount, setItemCount] = useState(0)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    document.title = `My Profile — Cortex`
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setFullName(data.user?.user_metadata?.full_name || '')
      setBio(data.user?.user_metadata?.bio || '')
      setAvatarUrl(data.user?.user_metadata?.avatar_url || null)
    })
    supabase.from('saved_items').select('id', { count: 'exact' }).then(({ count }) => {
      setItemCount(count || 0)
    })
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setAvatarMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarMenuOpen(false)
    setAvatarUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      // ✅ FIX: No 'avatars/' prefix — bucket is already named 'avatars'
      // Old (broken): `avatars/${user.id}.${fileExt}` → avatars/avatars/userid.png
      // New (correct): `${user.id}.${fileExt}`        → avatars/userid.png
      const filePath = `${user.id}.${fileExt}`

      // ✅ Delete old avatar first to avoid stale files
      const extensions = ['png', 'jpg', 'jpeg', 'webp', 'gif']
      for (const ext of extensions) {
        await supabase.storage.from('avatars').remove([`${user.id}.${ext}`])
      }

      // Upload to Supabase Storage (bucket: "avatars")
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      // ✅ Get public URL (no subfolder prefix)
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}` // cache bust

      // Save to user metadata
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
      setAvatarUrl(publicUrl)
    } catch (err) {
      console.error('Avatar upload failed:', err)
      alert('Upload failed: ' + err.message)
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    setAvatarMenuOpen(false)
    setAvatarUploading(true)
    try {
      // ✅ Also remove the actual file from storage
      if (user?.id) {
        const extensions = ['png', 'jpg', 'jpeg', 'webp', 'gif']
        for (const ext of extensions) {
          await supabase.storage.from('avatars').remove([`${user.id}.${ext}`])
        }
      }
      await supabase.auth.updateUser({ data: { avatar_url: null } })
      setAvatarUrl(null)
    } catch (err) {
      console.error('Remove avatar failed:', err)
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    await supabase.auth.updateUser({ data: { full_name: fullName, bio } })
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
  const firstName = rawName.split(/[\s._\d]/)[0].replace(/[^a-zA-Z]/g, '').toLowerCase()
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  const avatarColors = [
    ['#7c3aed', '#a855f7'], ['#ec4899', '#f472b6'],
    ['#2563eb', '#3b82f6'], ['#059669', '#10b981'],
  ]
  let hash = 0
  for (let c of (user?.email || '')) hash += c.charCodeAt(0)
  const [c1, c2] = avatarColors[hash % avatarColors.length]

  return (
    <div className="bg-[#0a0a0f] min-h-screen text-white">

      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpg,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">

        {/* Back button */}
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-10 transition group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Back to Dashboard
        </button>

        {/* Profile Header Card */}
        <div className="border border-white/5 rounded-2xl p-6 mb-5 flex items-center gap-6"
          style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>

          {/* Avatar */}
          <div className="relative shrink-0" ref={menuRef}>
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white cursor-pointer overflow-hidden relative group"
              style={!avatarUrl ? { background: `linear-gradient(135deg, ${c1}, ${c2})` } : {}}
              onClick={() => !avatarUploading && setAvatarMenuOpen(prev => !prev)}
            >
              {avatarUploading ? (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                  <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                </div>
              ) : avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-full h-full object-cover"
                  onError={() => setAvatarUrl(null)} // ✅ fallback if image fails
                />
              ) : (
                displayName.charAt(0)
              )}

              {!avatarUploading && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-white text-[10px] font-semibold">EDIT</span>
                </div>
              )}
            </div>

            {/* Dropdown */}
            {avatarMenuOpen && (
              <div className="absolute left-0 top-[88px] z-50 rounded-xl overflow-hidden shadow-2xl border border-white/10 min-w-[170px]"
                style={{ background: '#1a1a2e' }}>
                <button
                  onClick={() => { setAvatarMenuOpen(false); fileInputRef.current?.click() }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition text-left">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Photo
                </button>
                {avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition text-left border-t border-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove Photo
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-black text-white">{displayName}</h1>
            <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="text-xs text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full"
                style={{ background: 'rgba(124,58,237,0.08)' }}>
                ✦ Free Plan
              </span>
              <span className="text-xs text-gray-600 border border-white/5 px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                {itemCount} ideas saved
              </span>
              <span className="text-xs text-green-400 border border-green-500/20 px-3 py-1 rounded-full"
                style={{ background: 'rgba(52,211,153,0.05)' }}>
                ● Active
              </span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="border border-white/5 rounded-2xl p-6 flex flex-col gap-5 mb-5"
          style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
          <h2 className="text-white font-black text-lg">Edit Profile</h2>

          <div>
            <label className="text-gray-400 text-sm font-medium block mb-1.5">Full Name</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:ring-2 ring-purple-500/40 text-sm transition"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm font-medium block mb-1.5">
              Email <span className="text-gray-700">(cannot be changed)</span>
            </label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full border border-white/5 text-gray-600 px-4 py-3 rounded-xl text-sm cursor-not-allowed"
              style={{ background: 'rgba(255,255,255,0.01)' }}
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm font-medium block mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell us a bit about yourself..."
              rows={3}
              className="w-full border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:ring-2 ring-purple-500/40 text-sm resize-none transition"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition active:scale-95 disabled:opacity-40 relative overflow-hidden group"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)' }} />
            <span className="relative z-10">
              {saved ? '✓ Saved!' : loading ? 'Saving...' : 'Save Changes'}
            </span>
          </button>
        </div>

        {/* Account Info */}
        <div className="border border-white/5 rounded-2xl p-6 mb-5"
          style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
          <h2 className="text-white font-black text-lg mb-4">Account Info</h2>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-gray-500 text-sm">Member since</span>
              <span className="text-white text-sm font-semibold">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-gray-500 text-sm">Plan</span>
              <span className="text-purple-400 text-sm font-semibold">Free</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-500 text-sm">Ideas saved</span>
              <span className="text-white text-sm font-semibold">{itemCount}</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-500/10 rounded-2xl p-6"
          style={{ background: 'rgba(239,68,68,0.03)' }}>
          <h2 className="text-red-400 font-black text-lg mb-2">Danger Zone</h2>
          <p className="text-gray-600 text-sm mb-4">This will sign you out of all devices.</p>
          <button
            onClick={handleSignOut}
            className="px-5 py-2.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-semibold transition active:scale-95">
            Sign out of Cortex
          </button>
        </div>

      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import NotificationBell from './NotificationBell'

// ✅ Avatar now shows uploaded photo if available, else initials
function Avatar({ email, avatarUrl, size = 'md' }) {
  const [imgErr, setImgErr] = useState(false)
  const firstName = email?.split('@')[0] || 'user'
  const initials = firstName.slice(0, 2).toUpperCase()
  const colors = [
    ['#7c3aed', '#ec4899'],
    ['#6d28d9', '#2563eb'],
    ['#059669', '#7c3aed'],
    ['#dc2626', '#7c3aed'],
    ['#d97706', '#ec4899'],
    ['#2563eb', '#06b6d4'],
  ]
  const colorIndex = email?.charCodeAt(0) % colors.length || 0
  const [from, to] = colors[colorIndex]
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-sm'

  // ✅ Show uploaded photo if available
  if (avatarUrl && !imgErr) {
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        className={`${sizeClass} rounded-2xl object-cover shrink-0`}
        onError={() => setImgErr(true)}
      />
    )
  }

  // Fallback: colored initials
  return (
    <div className={`${sizeClass} rounded-2xl flex items-center justify-center font-black relative overflow-hidden shrink-0`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
      <div className="absolute inset-0 opacity-30"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
      <span className="relative z-10 tracking-wider">{initials}</span>
    </div>
  )
}

export default function Navbar({ user, onSave, onOpenChat, onOpenGraph }) {
  const [showDropdown, setShowDropdown] = useState(false)
  // ✅ Track avatar URL — updates instantly when user uploads photo
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || null)
  const navigate = useNavigate()

  const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
  const firstName = rawName.split(/[\s._\d]/)[0].replace(/[^a-zA-Z]/g, '').toLowerCase()
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  // ✅ Listen for auth changes so avatar updates instantly after upload in Profile
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAvatarUrl(session?.user?.user_metadata?.avatar_url || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const navItems = [
    { label: 'Dashboard', icon: '▦', action: () => navigate('/dashboard') },
    { label: 'Graph', icon: '◎', action: () => { onOpenGraph?.(); navigate('/dashboard') } },
    { label: 'Brainstorm', icon: '✦', action: () => onOpenChat?.() },
    { label: 'Analytics', icon: '📊', action: () => { navigate('/analytics'); setShowDropdown(false) } }
  ]

  const dropdownItems = [
    { icon: '▦', label: 'Dashboard', desc: 'View all saved items', action: () => { navigate('/dashboard'); setShowDropdown(false) } },
    { icon: '◎', label: 'Knowledge Graph', desc: 'See connections', action: () => { onOpenGraph?.(); setShowDropdown(false) } },
    { icon: '✦', label: 'Brainstorm', desc: 'Chat with your brain', action: () => { onOpenChat?.(); setShowDropdown(false) } },
    { icon: '👤', label: 'My Profile', desc: 'Edit your info', action: () => { navigate('/profile'); setShowDropdown(false) } },
    { icon: '📊', label: 'Analytics', desc: 'Your usage stats', action: () => { navigate('/analytics'); setShowDropdown(false) } },
  ]

  return (
    <nav className="sticky top-0 z-40 flex justify-between items-center px-8 py-4 border-b border-white/5"
      style={{ background: 'rgba(10,10,15,0.90)', backdropFilter: 'blur(20px)' }}>

      {/* Left */}
      <div className="flex items-center gap-6">
        <div className="text-3xl font-black tracking-tight cursor-pointer" onClick={() => navigate('/dashboard')}>
          cortex<span className="text-purple-400">.</span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <button key={item.label}
              onClick={item.action}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-base font-medium transition-all duration-200 active:scale-95">
              <span className="text-sm text-purple-400/70">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <NotificationBell user={user} />

        {/* Save Button */}
        <button onClick={onSave}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-base transition-all duration-200 relative overflow-hidden group active:scale-95"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)' }} />
          <span className="text-xl leading-none relative z-10">+</span>
          <span className="relative z-10">Save</span>
        </button>

        {/* Profile */}
        <div className="relative">
          <button onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl border border-white/8 hover:border-purple-500/40 transition-all duration-200 group active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
            {/* ✅ Pass avatarUrl to Avatar */}
            <Avatar email={user?.email} avatarUrl={avatarUrl} size="md" />
            <div className="hidden md:flex flex-col items-start">
              <span className="text-white text-base font-bold leading-tight">{displayName}</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-gray-500 text-xs">Active</span>
              </div>
            </div>
            <span className={`text-gray-600 text-sm transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-3 w-80 border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
              style={{ background: 'rgba(12,12,20,0.99)', backdropFilter: 'blur(30px)' }}>

              {/* Profile Header */}
              <div className="p-6 border-b border-white/5"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), transparent)' }}>
                <div className="flex items-center gap-4">
                  {/* ✅ Pass avatarUrl here too */}
                  <Avatar email={user?.email} avatarUrl={avatarUrl} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-xl">{displayName}</p>
                    <p className="text-gray-500 text-sm truncate">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-green-400 text-sm font-medium">Active now</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between px-4 py-2.5 rounded-xl border border-purple-500/20"
                  style={{ background: 'rgba(124,58,237,0.08)' }}>
                  <span className="text-purple-300 text-sm font-semibold">✦ Cortex Free</span>
                  <span className="text-sm text-purple-400 border border-purple-400/30 px-3 py-1 rounded-full hover:bg-purple-400/10 cursor-pointer transition">Upgrade →</span>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-3">
                {dropdownItems.map(item => (
                  <button key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all duration-150 text-left group">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-purple-500/20 group-hover:border-purple-500/40 transition"
                      style={{ background: 'rgba(124,58,237,0.08)' }}>
                      <span className="text-purple-400 text-sm">{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-gray-200 text-base font-semibold group-hover:text-white transition">{item.label}</p>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                    <span className="ml-auto text-gray-700 group-hover:text-purple-400 text-sm transition">→</span>
                  </button>
                ))}
              </div>

              {/* Sign Out */}
              <div className="px-3 pb-3">
                <button onClick={handleLogout}
                  className="w-full group flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200 border border-white/5 hover:border-red-500/30 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239,68,68,0.08), transparent)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)'}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-red-500/20 group-hover:border-red-500/40 group-hover:bg-red-500/10 transition-all">
                      <span className="text-red-400 text-base">→</span>
                    </div>
                    <div className="text-left">
                      <p className="text-gray-300 group-hover:text-red-400 font-semibold text-base transition-colors">Sign out</p>
                      <p className="text-gray-600 text-xs">See you next time 👋</p>
                    </div>
                  </div>
                  <span className="text-gray-700 group-hover:text-red-400 group-hover:translate-x-1 transition-all text-sm">→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDropdown && (
        <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
      )}
    </nav>
  )
}

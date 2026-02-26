import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([])
  const [showPanel, setShowPanel] = useState(false)
  const [loading, setLoading] = useState(true)

  const unreadCount = notifications.filter(n => !n.read).length

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications()

    // Real-time subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user.id])

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const markRead = async (id) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const deleteNotification = async (id) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const typeConfig = {
    info: { icon: '◎', color: 'text-blue-400', bg: 'rgba(96,165,250,0.1)', border: 'border-blue-500/20' },
    success: { icon: '✓', color: 'text-green-400', bg: 'rgba(52,211,153,0.1)', border: 'border-green-500/20' },
    warning: { icon: '⚡', color: 'text-yellow-400', bg: 'rgba(251,191,36,0.1)', border: 'border-yellow-500/20' },
    ai: { icon: '✦', color: 'text-purple-400', bg: 'rgba(167,139,250,0.1)', border: 'border-purple-500/20' },
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 hover:border-purple-500/30 transition-all group"
        style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
        <span className="text-gray-400 group-hover:text-white transition text-lg">🔔</span>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-purple-500 flex items-center justify-center px-1">
            <span className="text-white text-xs font-black">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </div>
        )}
      </button>

      {/* Panel */}
      {showPanel && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowPanel(false)} />

          <div className="absolute right-0 top-full mt-3 w-96 border border-white/10 rounded-2xl overflow-hidden z-40 shadow-2xl"
            style={{ background: 'rgba(12,12,20,0.99)', backdropFilter: 'blur(30px)' }}>

            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-white/5"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), transparent)' }}>
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-lg">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  className="text-xs text-purple-400 hover:text-purple-300 transition font-medium">
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🔔</p>
                  <p className="text-gray-500 text-sm font-medium">All caught up!</p>
                  <p className="text-gray-700 text-xs mt-1">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => {
                  const config = typeConfig[n.type] || typeConfig.info
                  return (
                    <div key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`flex gap-4 px-5 py-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/3 group ${!n.read ? 'bg-purple-500/5' : ''}`}>

                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${config.border}`}
                        style={{ background: config.bg }}>
                        <span className={`${config.color} text-sm`}>{config.icon}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm font-bold ${n.read ? 'text-gray-400' : 'text-white'}`}>
                            {n.title}
                          </p>
                          {!n.read && (
                            <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0 mt-1"></div>
                          )}
                        </div>
                        <p className="text-gray-600 text-xs leading-relaxed mt-0.5">{n.message}</p>
                        <p className="text-gray-700 text-xs mt-1">{timeAgo(n.created_at)}</p>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }}
                        className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition text-xs shrink-0 mt-1">
                        ✕
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-white/5 flex justify-between items-center">
                <span className="text-gray-700 text-xs">{notifications.length} total</span>
                <button
                  onClick={async () => {
                    await supabase.from('notifications').delete().eq('user_id', user.id)
                    setNotifications([])
                  }}
                  className="text-xs text-gray-700 hover:text-red-400 transition">
                  Clear all
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
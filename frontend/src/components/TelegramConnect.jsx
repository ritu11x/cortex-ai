// frontend/src/components/TelegramConnect.jsx
// Add this anywhere in Dashboard or Profile page

import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export default function TelegramConnect({ user }) {
  const [connected, setConnected]   = useState(false)
  const [loading, setLoading]       = useState(true)
  const [generating, setGenerating] = useState(false)
  const [code, setCode]             = useState(null)
  const [copied, setCopied]         = useState(false)
  const [telegramName, setTelegramName] = useState('')

  // Check if already connected
  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('telegram_connections')
      .select('telegram_name, created_at')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setConnected(true)
      setTelegramName(data.telegram_name || 'Telegram')
    }
    setLoading(false)
  }

  // Generate connect code
  const generateCode = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`${BACKEND_URL}/telegram/generate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      setCode(data.code)
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  // Disconnect
  const disconnect = async () => {
    if (!confirm('Disconnect Telegram?')) return
    await supabase.from('telegram_connections').delete().eq('user_id', user.id)
    setConnected(false)
    setCode(null)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return null

  return (
    <div className="border border-white/5 rounded-2xl p-6"
      style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>

      <div className="flex items-center gap-3 mb-4">
        {/* Telegram icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(0,136,204,0.15)', border: '1px solid rgba(0,136,204,0.3)' }}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0088cc">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.376l-2.967-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.835.95z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-white font-black text-base">Telegram Bot</h3>
          <p className="text-gray-600 text-xs">Save links by forwarding to @CortexSaveBot</p>
        </div>
        {/* Status badge */}
        <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold border ${
          connected
            ? 'text-green-400 border-green-500/20 bg-green-500/10'
            : 'text-gray-600 border-white/5 bg-white/2'
        }`}>
          {connected ? '● Connected' : '○ Not connected'}
        </div>
      </div>

      {/* ── Connected state ── */}
      {connected && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-500/10"
            style={{ background: 'rgba(52,211,153,0.05)' }}>
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-green-400 text-sm font-semibold">Connected as {telegramName}</p>
              <p className="text-gray-600 text-xs">Forward any link to @CortexSaveBot to save it</p>
            </div>
          </div>

          {/* How to use */}
          <div className="flex flex-col gap-2">
            {[
              { icon: '🎬', text: 'Forward a YouTube link → saved instantly' },
              { icon: '📸', text: 'Send an Instagram reel URL → organized by AI' },
              { icon: '📰', text: 'Share any article → summarized automatically' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2 text-gray-500 text-xs">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <button onClick={disconnect}
            className="text-red-400/60 hover:text-red-400 text-xs transition text-left mt-1">
            Disconnect Telegram →
          </button>
        </div>
      )}

      {/* ── Not connected state ── */}
      {!connected && !code && (
        <div className="flex flex-col gap-4">
          <p className="text-gray-500 text-sm">
            Connect Telegram to save any link by forwarding it to <strong className="text-blue-400">@CortexSaveBot</strong> — works with Instagram, YouTube, TikTok, anything.
          </p>
          <button onClick={generateCode} disabled={generating}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #0088cc, #006699)' }}>
            {generating ? '⏳ Generating...' : '🔗 Connect Telegram'}
          </button>
        </div>
      )}

      {/* ── Code generated state ── */}
      {!connected && code && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 px-4 py-4 rounded-xl border border-blue-500/20"
            style={{ background: 'rgba(0,136,204,0.08)' }}>
            <p className="text-blue-300 text-xs font-semibold">YOUR CONNECTION CODE</p>
            <div className="flex items-center gap-3">
              <code className="text-white text-2xl font-black tracking-widest">{code}</code>
              <button onClick={copyCode}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition"
                style={{
                  background: copied ? 'rgba(52,211,153,0.2)' : 'rgba(0,136,204,0.2)',
                  color: copied ? '#34d399' : '#0088cc',
                  border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(0,136,204,0.3)'}`,
                }}>
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-3">
            {[
              { n: '1', text: 'Open Telegram and search @CortexSaveBot' },
              { n: '2', text: 'Send /start to the bot' },
              { n: '3', text: `Send your code: ${code}` },
              { n: '4', text: 'Done! Forward any link to save it 🧠' },
            ].map(step => (
              <div key={step.n} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-blue-400 shrink-0 mt-0.5"
                  style={{ background: 'rgba(0,136,204,0.15)', border: '1px solid rgba(0,136,204,0.3)' }}>
                  {step.n}
                </span>
                <p className="text-gray-400 text-sm">{step.text}</p>
              </div>
            ))}
          </div>

          {/* Open Telegram button */}
          <a href="https://t.me/CortexSaveBot" target="_blank" rel="noopener noreferrer"
            className="w-full py-3 rounded-xl font-bold text-sm text-white text-center transition active:scale-95 block"
            style={{ background: 'linear-gradient(135deg, #0088cc, #006699)' }}>
            Open @CortexSaveBot →
          </a>

          <button onClick={checkConnection}
            className="text-gray-600 hover:text-gray-400 text-xs transition text-center">
            Already connected? Click to verify ↻
          </button>
        </div>
      )}
    </div>
  )
}
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export default function WhatsAppConnect({ user }) {
  const [connected, setConnected]   = useState(false)
  const [loading, setLoading]       = useState(true)
  const [generating, setGenerating] = useState(false)
  const [code, setCode]             = useState(null)
  const [copied, setCopied]         = useState(false)

  useEffect(() => { checkConnection() }, [])

  const checkConnection = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('whatsapp_connections')
      .select('phone, created_at')
      .eq('user_id', user.id)
      .single()
    setConnected(!!data)
    setLoading(false)
  }

  const generateCode = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`${BACKEND_URL}/whatsapp/generate-code`, {
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

  const disconnect = async () => {
    if (!confirm('Disconnect WhatsApp?')) return
    await supabase.from('whatsapp_connections').delete().eq('user_id', user.id)
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
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}>
          <span className="text-lg">💬</span>
        </div>
        <div>
          <h3 className="text-white font-black text-base">WhatsApp Bot</h3>
          <p className="text-gray-600 text-xs">Save links by sending to Cortex WhatsApp number</p>
        </div>
        <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold border ${
          connected
            ? 'text-green-400 border-green-500/20 bg-green-500/10'
            : 'text-gray-600 border-white/5'
        }`}>
          {connected ? '● Connected' : '○ Not connected'}
        </div>
      </div>

      {/* Connected */}
      {connected && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-500/10"
            style={{ background: 'rgba(52,211,153,0.05)' }}>
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-green-400 text-sm font-semibold">WhatsApp Connected!</p>
              <p className="text-gray-600 text-xs">Send any link to your Cortex WhatsApp number to save it</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { icon: '🎬', text: 'Send YouTube link → saved instantly' },
              { icon: '📸', text: 'Forward Instagram reel URL → organized by AI' },
              { icon: '📰', text: 'Share any article → summarized automatically' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2 text-gray-500 text-xs">
                <span>{item.icon}</span><span>{item.text}</span>
              </div>
            ))}
          </div>
          <button onClick={disconnect}
            className="text-red-400/60 hover:text-red-400 text-xs transition text-left mt-1">
            Disconnect WhatsApp →
          </button>
        </div>
      )}

      {/* Not connected */}
      {!connected && !code && (
        <div className="flex flex-col gap-4">
          <p className="text-gray-500 text-sm">
            Connect WhatsApp to save any link by sending it to the Cortex number — works with Instagram, YouTube, TikTok, anything.
          </p>
          <button onClick={generateCode} disabled={generating}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}>
            {generating ? '⏳ Generating...' : '💬 Connect WhatsApp'}
          </button>
        </div>
      )}

      {/* Code generated */}
      {!connected && code && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 px-4 py-4 rounded-xl border border-green-500/20"
            style={{ background: 'rgba(37,211,102,0.08)' }}>
            <p className="text-green-300 text-xs font-semibold">YOUR CONNECTION CODE</p>
            <div className="flex items-center gap-3">
              <code className="text-white text-2xl font-black tracking-widest">{code}</code>
              <button onClick={copyCode}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition"
                style={{
                  background: copied ? 'rgba(52,211,153,0.2)' : 'rgba(37,211,102,0.2)',
                  color: copied ? '#34d399' : '#25d366',
                  border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(37,211,102,0.3)'}`,
                }}>
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { n: '1', text: 'Save this number on your phone: +14155238886' },
              { n: '2', text: 'Send "join <sandbox-word>" to that number on WhatsApp' },
              { n: '3', text: `Send your code: ${code}` },
              { n: '4', text: 'Done! Send any link to save it 🧠' },
            ].map(step => (
              <div key={step.n} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-green-400 shrink-0 mt-0.5"
                  style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}>
                  {step.n}
                </span>
                <p className="text-gray-400 text-sm">{step.text}</p>
              </div>
            ))}
          </div>

          <a href="https://wa.me/14155238886" target="_blank" rel="noopener noreferrer"
            className="w-full py-3 rounded-xl font-bold text-sm text-white text-center transition active:scale-95 block"
            style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}>
            Open WhatsApp →
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
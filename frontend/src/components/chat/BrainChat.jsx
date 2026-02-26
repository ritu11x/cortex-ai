import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

export default function BrainChat({ items, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Cortex has access to all ${items.length} items in your second brain. Ask me anything — summarize topics, find connections, generate ideas, or brainstorm content!`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat`,
        {
          message: input,
          items: items.map(i => ({
            title: i.title,
            summary: i.summary,
            tags: i.tags,
            category: i.category,
            content: i.content,
          }))
        }
      )

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.reply
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Make sure your backend is running!'
      }])
    }

    setLoading(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestions = [
    'Summarize everything I saved this week',
    'What topics am I most interested in?',
    'Find connections between my saved items',
    'Generate a Twitter thread from my tech saves',
    'What should I learn next based on my interests?',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>

      <div className="w-full max-w-3xl h-[85vh] flex flex-col rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
          <div>
            <h2 className="text-white font-black text-lg flex items-center gap-2">
              <span className="text-purple-400">✦</span> Brainstorm with Cortex
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Chatting with {items.length} saved items
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">

          {/* Suggestion chips - show only at start */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs text-purple-300/70 border border-purple-400/20 bg-purple-400/5 px-3 py-1.5 rounded-full hover:border-purple-400/40 hover:text-purple-300 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-sm'
                  : 'border border-white/5 text-gray-200 rounded-bl-sm'
              }`}
                style={msg.role === 'assistant' ? { background: 'rgba(255,255,255,0.03)' } : {}}>

                {msg.role === 'assistant' && (
                  <span className="text-purple-400 text-xs font-semibold block mb-1">✦ Cortex AI</span>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="border border-white/5 rounded-2xl rounded-bl-sm px-5 py-3"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-purple-400 text-xs font-semibold block mb-1">✦ Miles AI</span>
                <div className="flex gap-1 items-center py-1">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-white/5">
          <div className="flex gap-3 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask Cortex anything about your saved content..."
              rows={2}
              className="flex-1 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:ring-2 ring-purple-500/50 text-sm resize-none"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-semibold transition text-sm h-fit"
            >
              Send →
            </button>
          </div>
          <p className="text-gray-700 text-xs mt-2">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

export default function BrainChat({ items, onClose, isSelectedMode = false, selectedCount = 0 }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: isSelectedMode
        ? `I'm focused on the ${items.length} items you selected. Ask me to find connections, generate content, or brainstorm ideas from these specific items!`
        : `Cortex has access to all ${items.length} items in your second brain. Ask me anything — summarize topics, find connections, generate ideas, or brainstorm content!`
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
            title: i.title, summary: i.summary,
            tags: i.tags, category: i.category, content: i.content,
          }))
        }
      )
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Make sure your backend is running!'
      }])
    }
    setLoading(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const suggestions = isSelectedMode ? [
    'Find connections between these items',
    'Generate a Twitter thread from these',
    'What are the key insights from these?',
    'Create a summary of everything selected',
    'What should I learn next based on these?',
  ] : [
    'Summarize everything I saved this week',
    'What topics am I most interested in?',
    'Find connections between my saved items',
    'Generate a Twitter thread from my tech saves',
    'What should I learn next based on my interests?',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>

      <div className="w-full max-w-3xl h-[85vh] flex flex-col rounded-2xl border overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)',
          borderColor: isSelectedMode ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)',
        }}>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
          <div>
            <h2 className="text-white font-black text-lg flex items-center gap-2">
              <span className={isSelectedMode ? 'text-green-400' : 'text-purple-400'}>✦</span>
              {isSelectedMode ? 'Brainstorm — Selected Items' : 'Brainstorm with Cortex'}
            </h2>
            <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-2">
              {isSelectedMode ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
                  Focused on {items.length} selected items
                </>
              ) : (
                `Chatting with all ${items.length} saved items`
              )}
            </p>
          </div>

          {/* ✅ Show selected item pills */}
          {isSelectedMode && (
            <div className="hidden md:flex gap-1 flex-wrap max-w-xs">
              {items.slice(0, 3).map(item => (
                <span key={item.id} className="text-xs text-green-300/70 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full truncate max-w-[100px]">
                  {item.title}
                </span>
              ))}
              {items.length > 3 && (
                <span className="text-xs text-gray-600 px-1">+{items.length - 3} more</span>
              )}
            </div>
          )}

          <button onClick={onClose}
            className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition ml-3">
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {suggestions.map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className={`text-xs border px-3 py-1.5 rounded-full hover:text-white transition ${
                    isSelectedMode
                      ? 'text-green-300/70 border-green-400/20 bg-green-400/5 hover:border-green-400/40'
                      : 'text-purple-300/70 border-purple-400/20 bg-purple-400/5 hover:border-purple-400/40'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? isSelectedMode ? 'bg-green-600 text-white rounded-br-sm' : 'bg-purple-600 text-white rounded-br-sm'
                  : 'border border-white/5 text-gray-200 rounded-bl-sm'
              }`}
                style={msg.role === 'assistant' ? { background: 'rgba(255,255,255,0.03)' } : {}}>
                {msg.role === 'assistant' && (
                  <span className={`text-xs font-semibold block mb-1 ${isSelectedMode ? 'text-green-400' : 'text-purple-400'}`}>
                    ✦ Cortex AI
                  </span>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="border border-white/5 rounded-2xl rounded-bl-sm px-5 py-3"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className={`text-xs font-semibold block mb-1 ${isSelectedMode ? 'text-green-400' : 'text-purple-400'}`}>✦ Cortex AI</span>
                <div className="flex gap-1 items-center py-1">
                  {[0, 150, 300].map(d => (
                    <div key={d} className={`w-2 h-2 rounded-full animate-bounce ${isSelectedMode ? 'bg-green-400' : 'bg-purple-400'}`}
                      style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-white/5">
          <div className="flex gap-3 items-end">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder={isSelectedMode ? `Ask about these ${items.length} items...` : 'Ask Cortex anything about your saved content...'}
              rows={2}
              className="flex-1 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:ring-2 ring-purple-500/50 text-sm resize-none"
              style={{ background: 'rgba(255,255,255,0.03)' }} />
            <button onClick={handleSend} disabled={loading || !input.trim()}
              className={`px-5 py-3 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-semibold transition text-sm h-fit text-white ${
                isSelectedMode ? 'bg-green-600 hover:bg-green-500' : 'bg-purple-600 hover:bg-purple-500'
              }`}>
              Send →
            </button>
          </div>
          <p className="text-gray-700 text-xs mt-2">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}
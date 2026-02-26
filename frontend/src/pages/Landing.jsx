import { useState } from 'react'
import LoginForm from '../components/auth/LoginForm'
import SignupForm from '../components/auth/SignupForm'
import ReviewSection from '../components/landing/ReviewSection'
import DemoModal from '../components/DemoModal'

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  return (
    <div className="bg-[#0a0a0f] min-h-screen text-white overflow-x-hidden">

      <div className="fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      <div className="fixed top-[-200px] left-[20%] w-[600px] h-[600px] rounded-full z-0"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />
      <div className="fixed top-[200px] right-[10%] w-[400px] h-[400px] rounded-full z-0"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)' }} />

      {/* NAVBAR */}
      <nav className="relative z-10 flex justify-between items-center px-10 py-5 border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-10">
          <div className="text-2xl font-black tracking-tight cursor-pointer">
            cortex<span className="text-purple-400">.</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Features', icon: '✦', href: 'features' },
              { label: 'How it works', icon: '◎', href: 'howitworks' },
              { label: 'Reviews', icon: '◈', href: 'reviews' },
              { label: 'Blog', icon: '↗', href: 'blog' },
            ].map(item => (
              <button key={item.label}
                onClick={() => document.getElementById(item.href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 text-sm font-medium transition-all duration-200 group">
                <span className="text-purple-400/50 text-xs group-hover:text-purple-400 transition-colors">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setShowLogin(true); setShowSignup(false) }}
            className="px-5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-full transition-all duration-200">
            Log in
          </button>
          <button onClick={() => { setShowSignup(true); setShowLogin(false) }}
            className="relative px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-200 overflow-hidden group active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)' }} />
            <span className="relative z-10 flex items-center gap-2">
              Get started free
              <span className="text-purple-300 group-hover:translate-x-0.5 transition-transform">→</span>
            </span>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 pb-10">
        <div className="flex items-center gap-2 text-sm border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 rounded-full mb-10 text-purple-300">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          Now with Claude AI — smarter than ever
        </div>
        <h1 className="text-[50px] sm:text-[70px] md:text-[110px] font-black leading-[0.9] tracking-tighter max-w-4xl mb-8">
          <span className="text-white">Stop losing</span><br />
          <span className="text-white">ideas.</span><br />
          <span style={{ background: 'linear-gradient(135deg, #f472b6, #a78bfa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Save</span><br />
          <span style={{ background: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 40%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>everything.</span><br />
          <span className="text-white">Find</span><br />
          <span className="text-white">anything.</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-lg mb-10 leading-relaxed">
          Cortex is your AI-powered second brain. Save links, notes, and content from anywhere — and let AI organize, summarize, and surface it for you.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <button onClick={() => setShowSignup(true)}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-full font-semibold text-lg transition active:scale-95">
            Start for free →
          </button>
          <button onClick={() => setShowDemo(true)}
            className="group px-8 py-4 border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 rounded-full font-semibold text-lg transition flex items-center gap-3 active:scale-95">
            <span className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-purple-500/20 flex items-center justify-center text-sm transition-all group-hover:scale-110">▶</span>
            Watch demo
          </button>
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" className="relative z-10 px-4 md:px-10 py-16 md:py-32 border-t border-white/5">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/20 text-purple-300/70 text-sm font-semibold mb-6"
            style={{ background: 'rgba(124,58,237,0.08)' }}>
            <span className="text-purple-400">✦</span> Everything you need
          </div>
          <h2 className="text-3xl md:text-6xl font-black tracking-tight mb-4">
            Built for how you<br />
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>actually think.</span>
          </h2>
          <p className="text-gray-500 text-xl max-w-xl mx-auto">Stop losing ideas across apps. Cortex connects everything into one intelligent space.</p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div onClick={() => setShowSignup(true)}
            className="group relative rounded-3xl p-8 cursor-pointer transition-all duration-500 overflow-hidden border border-white/5 hover:border-purple-500/30"
            style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border border-purple-500/20" style={{ background: 'rgba(124,58,237,0.1)' }}>✦</div>
              <span className="text-xs text-purple-400/60 border border-purple-500/20 px-3 py-1 rounded-full group-hover:text-purple-400 transition">Try it →</span>
            </div>
            <h3 className="text-3xl font-black mb-3 tracking-tight group-hover:text-purple-100 transition-colors">AI Summarization</h3>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">Every saved item gets instantly summarized by Claude AI. Never re-read a 30-minute video again.</p>
            <div className="border border-white/5 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                <span className="text-purple-400 text-xs font-semibold">AI Summary</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">"This video covers the fundamentals of building a second brain using AI tools, focusing on capture, organize, and retrieve workflows..."</p>
              <div className="flex gap-2 mt-3">
                {['#productivity', '#AI', '#learning'].map(tag => (
                  <span key={tag} className="text-xs text-purple-300/50 bg-purple-400/5 border border-purple-400/10 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          <div onClick={() => setShowSignup(true)}
            className="group relative rounded-3xl p-8 cursor-pointer transition-all duration-500 overflow-hidden border border-white/5 hover:border-blue-500/30"
            style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.12), transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border border-blue-500/20" style={{ background: 'rgba(96,165,250,0.1)' }}>◎</div>
              <span className="text-xs text-blue-400/60 border border-blue-500/20 px-3 py-1 rounded-full group-hover:text-blue-400 transition">Try it →</span>
            </div>
            <h3 className="text-3xl font-black mb-3 tracking-tight group-hover:text-blue-100 transition-colors">Knowledge Graph</h3>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">See how your ideas connect. Cortex builds a visual map of your knowledge — automatically.</p>
            <div className="border border-white/5 rounded-2xl p-4 flex items-center justify-center h-28" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-sm absolute">C</div>
                {[{ label: 'AI', x: '-60px', y: '-30px' }, { label: 'Tech', x: '60px', y: '-30px' }, { label: 'Ideas', x: '-50px', y: '35px' }, { label: 'Web', x: '55px', y: '35px' }].map((n) => (
                  <div key={n.label} className="absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border"
                    style={{ left: `calc(50% + ${n.x})`, top: `calc(50% + ${n.y})`, transform: 'translate(-50%, -50%)', background: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.3)', color: '#a78bfa' }}>
                    {n.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: '◈', color: 'pink', border: 'border-pink-500/20', bg: 'rgba(244,114,182,0.1)', hoverBorder: 'hover:border-pink-500/30', glow: 'rgba(244,114,182,0.06)', title: 'Save from Anywhere', desc: 'Instagram, YouTube, Twitter, WhatsApp — save from any platform in seconds.', extra: (
              <div className="flex gap-2">
                {[{ icon: '◈', color: '#e1306c', bg: 'rgba(225,48,108,0.1)', label: 'IG' }, { icon: '▶', color: '#ff4444', bg: 'rgba(255,68,68,0.1)', label: 'YT' }, { icon: '𝕏', color: '#1da1f2', bg: 'rgba(29,161,242,0.1)', label: 'TW' }, { icon: '◉', color: '#25d366', bg: 'rgba(37,211,102,0.1)', label: 'WA' }].map(p => (
                  <div key={p.label} className="w-9 h-9 rounded-xl flex items-center justify-center text-sm border border-white/5" style={{ background: p.bg, color: p.color }}>{p.icon}</div>
                ))}
              </div>
            )},
            { icon: '✦', color: 'green', border: 'border-green-500/20', bg: 'rgba(52,211,153,0.1)', hoverBorder: 'hover:border-green-500/30', glow: 'rgba(52,211,153,0.06)', title: 'AI Brainstorm', desc: 'Chat with your saved content. Ask questions, get insights, generate ideas instantly.', extra: (
              <div className="border border-white/5 rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex justify-end"><div className="bg-green-500/10 border border-green-500/20 text-green-300 text-xs px-3 py-1.5 rounded-xl rounded-br-sm">What did I save about AI?</div></div>
                <div className="flex justify-start"><div className="border border-white/5 text-gray-400 text-xs px-3 py-1.5 rounded-xl rounded-bl-sm" style={{ background: 'rgba(255,255,255,0.02)' }}>You saved 5 items about AI including...</div></div>
              </div>
            )},
            { icon: '⚡', color: 'yellow', border: 'border-yellow-500/20', bg: 'rgba(251,191,36,0.1)', hoverBorder: 'hover:border-yellow-500/30', glow: 'rgba(251,191,36,0.06)', title: 'Personal Feed', desc: 'Turn saved content into Twitter threads, newsletters, or podcast scripts with one click.', extra: (
              <div className="flex flex-wrap gap-2">
                {['Thread', 'Newsletter', 'Podcast', '60s Read'].map(f => (
                  <span key={f} className="text-xs border border-yellow-500/20 text-yellow-300/60 px-3 py-1 rounded-full" style={{ background: 'rgba(251,191,36,0.05)' }}>{f}</span>
                ))}
              </div>
            )},
          ].map(card => (
            <div key={card.title} onClick={() => setShowSignup(true)}
              className={`group relative rounded-3xl p-7 cursor-pointer transition-all duration-500 overflow-hidden border border-white/5 ${card.hoverBorder}`}
              style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle at top right, ${card.glow}, transparent 70%)` }} />
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${card.border} mb-6`} style={{ background: card.bg }}>{card.icon}</div>
              <h3 className="text-2xl font-black mb-2 transition-colors">{card.title}</h3>
              <p className="text-gray-500 leading-relaxed mb-6">{card.desc}</p>
              {card.extra}
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="howitworks" className="relative z-10 px-10 py-24 border-t border-white/5">
        <div className="text-center mb-16">
          <p className="text-purple-400 text-sm font-semibold tracking-widest uppercase mb-3">How it works</p>
          <h2 className="text-5xl font-black tracking-tight">Three steps to clarity</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto">
          {[
            { step: '01', title: 'Save anything', desc: 'Paste a link, type a note, or share content directly. Takes 2 seconds.' },
            { step: '02', title: 'AI organizes it', desc: 'Claude AI reads it, summarizes it, tags it, and categorizes it automatically.' },
            { step: '03', title: 'Find it instantly', desc: 'Search your entire second brain in seconds. Never lose an idea again.' },
          ].map((s) => (
            <div key={s.step} className="flex-1 border border-white/5 rounded-2xl p-8">
              <div className="text-6xl font-black text-white/10 mb-4">{s.step}</div>
              <h3 className="text-xl font-bold mb-3">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <ReviewSection onSignup={() => setShowSignup(true)} />

      {/* BLOG */}
      <div id="blog" className="relative z-10 px-10 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-purple-400 text-sm font-semibold tracking-widest uppercase mb-3">Blog</p>
            <h2 className="text-5xl font-black tracking-tight">From the Cortex team</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { tag: 'Guide', tagColor: 'text-purple-400 border-purple-400/20 bg-purple-400/5', title: 'How to build a second brain in 2026', desc: 'A step by step guide to capturing, organizing and retrieving your ideas using AI tools.', time: '5 min read', color: '#7c3aed' },
              { tag: 'Product', tagColor: 'text-blue-400 border-blue-400/20 bg-blue-400/5', title: 'Introducing the Knowledge Graph', desc: 'See how your ideas connect visually. Our new graph view maps your entire second brain.', time: '3 min read', color: '#2563eb' },
              { tag: 'Tips', tagColor: 'text-green-400 border-green-400/20 bg-green-400/5', title: '10 ways to use AI Brainstorm', desc: 'From content ideas to research summaries — here are the most powerful ways to chat with your brain.', time: '7 min read', color: '#059669' },
            ].map((post) => (
              <div key={post.title} onClick={() => setShowSignup(true)}
                className="group border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-white/10 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${post.color}, transparent)` }} />
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-xs px-3 py-1 rounded-full border font-medium ${post.tagColor}`}>{post.tag}</span>
                    <span className="text-gray-700 text-xs">{post.time}</span>
                  </div>
                  <h3 className="text-white font-black text-lg mb-2 group-hover:text-purple-200 transition-colors leading-snug">{post.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{post.desc}</p>
                  <span className="text-purple-400/60 text-sm group-hover:text-purple-400 transition-colors flex items-center gap-1">Read more <span className="group-hover:translate-x-1 transition-transform inline-block">→</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 px-10 py-24">
        <div className="max-w-4xl mx-auto text-center border border-purple-500/20 rounded-3xl py-20 px-10"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.05))' }}>
          <h2 className="text-3xl md:text-6xl font-black tracking-tight mb-6">
            Start building your<br />
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>second brain today.</span>
          </h2>
          <p className="text-gray-400 mb-10 text-lg">Free to start. No credit card required.</p>
          <button onClick={() => setShowSignup(true)}
            className="px-10 py-4 bg-purple-600 hover:bg-purple-500 rounded-full font-bold text-xl transition active:scale-95">
            Get started free →
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 px-10 py-8" style={{ background: 'rgba(10,10,15,0.95)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <span className="text-xl font-black tracking-tight">cortex<span className="text-purple-400">.</span></span>
            <div className="w-px h-4 bg-white/10"></div>
            <span className="text-gray-600 text-sm">Your AI second brain</span>
          </div>
          <div className="flex items-center gap-6">
            {['Features', 'How it works', 'Reviews', 'Blog'].map(link => (
              <button key={link} onClick={() => document.getElementById(link.toLowerCase().replace(/ /g, ''))?.scrollIntoView({ behavior: 'smooth' })}
                className="text-gray-600 hover:text-gray-300 text-xs font-medium transition-colors">{link}</button>
            ))}
            <div className="w-px h-3 bg-white/10"></div>
            <button className="text-gray-600 hover:text-gray-300 text-xs transition-colors">Privacy</button>
            <button className="text-gray-600 hover:text-gray-300 text-xs transition-colors">Terms</button>
          </div>
          <div className="flex items-center gap-4">
            {[{ icon: '◈', label: 'Instagram', color: 'hover:text-pink-400' }, { icon: '▶', label: 'YouTube', color: 'hover:text-red-400' }, { icon: '𝕏', label: 'Twitter', color: 'hover:text-blue-400' }].map(s => (
              <button key={s.label} className={`text-gray-700 ${s.color} transition-colors text-base w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center`}>{s.icon}</button>
            ))}
            <div className="w-px h-4 bg-white/10"></div>
            <div className="flex items-center gap-1.5 text-gray-700 text-xs"><span>Built with</span><span className="text-purple-400/60">✦</span><span>Claude AI</span></div>
            <div className="w-px h-4 bg-white/10"></div>
            <span className="text-gray-700 text-xs">© 2026 Cortex</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-white/[0.03] flex justify-between items-center">
          <span className="text-gray-800 text-xs">trycortex.ai</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-gray-700 text-xs">All systems operational</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-700">© 2026 Developed by</span>
            <a href="mailto:vishwakarmaritu011@gmail.com" className="text-purple-400/70 hover:text-purple-400 transition-colors font-semibold hover:underline underline-offset-2">Ritu Vishwakarma</a>
          </div>
        </div>
      </footer>

      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}

      {showLogin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-8 w-full max-w-md relative">
            <button onClick={() => setShowLogin(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <LoginForm />
            <p className="text-center text-gray-500 mt-4 text-sm">
              No account?{' '}
              <button onClick={() => { setShowSignup(true); setShowLogin(false) }} className="text-purple-400 hover:underline">Sign up free</button>
            </p>
          </div>
        </div>
      )}

      {showSignup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-8 w-full max-w-md relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowSignup(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <SignupForm />
            <p className="text-center text-gray-500 mt-4 text-sm">
              Have an account?{' '}
              <button onClick={() => { setShowLogin(true); setShowSignup(false) }} className="text-purple-400 hover:underline">Log in</button>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

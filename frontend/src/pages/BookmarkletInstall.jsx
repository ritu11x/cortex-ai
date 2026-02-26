import { useState } from 'react'

// ✅ Replace this URL with your actual Vercel URL
const CORTEX_URL = 'https://cortex-ai-lime.vercel.app'

// ✅ The bookmarklet — injects a save popup on any website
const BOOKMARKLET = `javascript:(function(){if(document.getElementById('cortex-bm'))return;var CU='${CORTEX_URL}';var url=window.location.href;var title=document.title||'';var sel=window.getSelection?window.getSelection().toString():'';var meta=document.querySelector('meta[name="description"]');var desc=meta?meta.content:'';var s=document.createElement('style');s.textContent='#cortex-bm{all:initial;position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,sans-serif}#cortex-ov{position:absolute;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px)}#cortex-md{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:420px;max-width:calc(100vw - 32px);background:#0f0f1a;border:1px solid rgba(124,58,237,0.35);border-radius:20px;padding:24px;box-shadow:0 25px 60px rgba(0,0,0,0.8),0 0 0 1px rgba(124,58,237,0.1)}#cortex-md *{box-sizing:border-box}.clbl{display:block;font-size:11px;font-weight:600;color:#6b7280;margin:10px 0 5px;text-transform:uppercase;letter-spacing:.5px;font-family:-apple-system,sans-serif}.cinp{display:block;width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 13px;font-size:13px;color:#e5e7eb;outline:none;font-family:-apple-system,sans-serif}.cinp:focus{border-color:rgba(124,58,237,0.6)}.cbtn{display:block;width:100%;padding:13px;background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:12px;font-size:14px;font-weight:700;color:#fff;cursor:pointer;text-align:center;margin-top:14px;border:none;font-family:-apple-system,sans-serif}.cbtn:hover{opacity:.9}';document.head.appendChild(s);var w=document.createElement('div');w.id='cortex-bm';w.innerHTML='<div id="cortex-ov"></div><div id="cortex-md"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px"><span style="font-size:20px;font-weight:900;color:#fff;font-family:-apple-system,sans-serif">cortex<span style=color:#a78bfa>.</span></span><span id="cortex-cx" style="cursor:pointer;color:#6b7280;font-size:18px;line-height:1;padding:4px 8px;border-radius:8px;background:rgba(255,255,255,0.05)">✕</span></div><div style="display:inline-flex;align-items:center;gap:6px;background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);border-radius:20px;padding:4px 10px;font-size:11px;color:#a78bfa;font-weight:600;font-family:-apple-system,sans-serif;margin-bottom:12px">✦ AI will summarize this</div><label class="clbl">URL</label><input class="cinp" id="cortex-cu" /><label class="clbl">TITLE</label><input class="cinp" id="cortex-ct" /><label class="clbl">NOTE (optional)</label><textarea class="cinp" id="cortex-cn" rows="2" style="resize:none"></textarea><button class="cbtn" id="cortex-sb">✦ Save to my Brain</button><div id="cortex-ok" style="display:none;text-align:center;padding:24px 0"><div style="font-size:44px;margin-bottom:10px">🧠</div><div style="font-size:15px;font-weight:700;color:#fff;font-family:-apple-system,sans-serif">Saved to Cortex!</div><div style="font-size:13px;color:#6b7280;margin-top:6px;font-family:-apple-system,sans-serif">AI is organizing it now...</div></div></div>';document.body.appendChild(w);document.getElementById('cortex-cu').value=url;document.getElementById('cortex-ct').value=title;if(sel||desc)document.getElementById('cortex-cn').value=sel||desc;function cl(){var el=document.getElementById('cortex-bm');if(el)el.remove();}document.getElementById('cortex-ov').onclick=cl;document.getElementById('cortex-cx').onclick=cl;document.addEventListener('keydown',function(e){if(e.key==='Escape')cl();});document.getElementById('cortex-sb').onclick=function(){var u=document.getElementById('cortex-cu').value.trim();var t=document.getElementById('cortex-ct').value.trim();var n=document.getElementById('cortex-cn').value.trim();if(!u)return;this.textContent='Saving...';this.style.opacity='0.6';var p=new URLSearchParams({openSave:'true',sharedUrl:u,sharedTitle:t,sharedNote:n});window.open(CU+'/dashboard?'+p.toString(),'_blank');document.getElementById('cortex-sb').style.display='none';document.getElementById('cortex-ok').style.display='block';setTimeout(cl,2200);};})();`

export default function BookmarkletInstall() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(BOOKMARKLET)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-4 py-12">

      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      <div className="fixed top-[-200px] left-[20%] w-[500px] h-[500px] rounded-full z-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-xl w-full">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-4xl font-black mb-3">cortex<span className="text-purple-400">.</span></div>
          <h1 className="text-3xl font-black mb-3">One-click save</h1>
          <p className="text-gray-500 text-lg">Add Cortex to your browser bar — save any page instantly, from anywhere on the web.</p>
        </div>

        {/* Step 1 — Drag */}
        <div className="border border-white/5 rounded-2xl p-6 mb-4"
          style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
          <div className="flex items-center gap-3 mb-1">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-purple-400 shrink-0"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>1</span>
            <h2 className="font-black text-white text-lg">Drag this button to your bookmark bar</h2>
          </div>
          <p className="text-gray-600 text-sm mb-5 ml-10">Grab the purple button and drag it up to your browser bookmarks bar</p>

          {/* ✅ THE DRAGGABLE BUTTON */}
          <div className="flex flex-col items-center gap-3 py-8 border border-dashed border-purple-500/20 rounded-2xl"
            style={{ background: 'rgba(124,58,237,0.03)' }}>
            <p className="text-gray-600 text-xs mb-1">👇 Drag this to your bookmarks bar</p>
            <a
              href={BOOKMARKLET}
              draggable="true"
              onClick={e => e.preventDefault()}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base text-white cursor-grab active:cursor-grabbing select-none transition-transform hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                boxShadow: '0 4px 24px rgba(124,58,237,0.5), 0 0 0 1px rgba(167,139,250,0.2)'
              }}>
              🧠 Save to Cortex
            </a>
            <p className="text-gray-700 text-xs">Hold and drag ↑ to your bookmarks bar</p>
          </div>
        </div>

        {/* Step 2 — Show bookmark bar */}
        <div className="border border-white/5 rounded-2xl p-6 mb-4"
          style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
          <div className="flex items-center gap-3 mb-1">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-purple-400 shrink-0"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>2</span>
            <h2 className="font-black text-white text-lg">Can't see the bookmark bar?</h2>
          </div>
          <p className="text-gray-600 text-sm ml-10 mb-4">Press this shortcut to show it:</p>
          <div className="flex flex-col gap-2 ml-10">
            {[
              { browser: '🌐 Chrome / Edge', shortcut: 'Ctrl + Shift + B' },
              { browser: '🦊 Firefox', shortcut: 'Ctrl + Shift + B' },
              { browser: '🧭 Safari (Mac)', shortcut: 'Cmd + Shift + B' },
            ].map(b => (
              <div key={b.browser} className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-white/5"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-gray-400 text-sm">{b.browser}</span>
                <kbd className="text-xs text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-lg font-mono"
                  style={{ background: 'rgba(124,58,237,0.08)' }}>{b.shortcut}</kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3 — Use it */}
        <div className="border border-white/5 rounded-2xl p-6 mb-5"
          style={{ background: 'linear-gradient(135deg, #0f0f1a, #0a0a12)' }}>
          <div className="flex items-center gap-3 mb-1">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-purple-400 shrink-0"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>3</span>
            <h2 className="font-black text-white text-lg">Use it on any website!</h2>
          </div>
          <p className="text-gray-600 text-sm ml-10 mb-4">Go to any page, click <strong className="text-purple-400">🧠 Save to Cortex</strong> in your bar</p>
          <div className="grid grid-cols-2 gap-2 ml-10">
            {[
              { icon: '🎬', text: 'YouTube videos' },
              { icon: '📰', text: 'Articles & blogs' },
              { icon: '🐦', text: 'Twitter threads' },
              { icon: '🛍️', text: 'Products to remember' },
              { icon: '📚', text: 'Research papers' },
              { icon: '💡', text: 'Any page ever!' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/5"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span>{item.icon}</span>
                <span className="text-gray-400 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Manual fallback */}
        <div className="border border-white/5 rounded-2xl p-5 mb-8"
          style={{ background: 'rgba(255,255,255,0.01)' }}>
          <p className="text-gray-700 text-xs text-center mb-3">Can't drag? Add manually — create a new bookmark, paste this as the URL:</p>
          <div className="flex gap-2">
            <div className="flex-1 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-700 truncate font-mono"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              javascript:(function(){"{"}...{"}"})()
            </div>
            <button onClick={handleCopy}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0"
              style={{
                background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(124,58,237,0.15)',
                color: copied ? '#34d399' : '#a78bfa',
                border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(124,58,237,0.3)'}`
              }}>
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>

        {/* Back */}
        <div className="text-center">
          <a href="/dashboard" className="text-purple-400/50 hover:text-purple-400 text-sm transition">
            ← Back to Dashboard
          </a>
        </div>

      </div>
    </div>
  )
}

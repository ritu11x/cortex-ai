// backend/whatsappBot.js

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL  = process.env.SUPABASE_URL
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY
const GROQ_KEY      = process.env.GROQ_API_KEY
const TWILIO_SID    = process.env.TWILIO_ACCOUNT_SID
const TWILIO_TOKEN  = process.env.TWILIO_AUTH_TOKEN
const FROM_NUMBER   = process.env.TWILIO_WHATSAPP_FROM

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Send WhatsApp message via Twilio ─────────────────────────
async function sendWhatsApp(to, body) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
  const params = new URLSearchParams({
    From: FROM_NUMBER,
    To:   to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
    Body: body,
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
    },
    body: params,
  })
  return res.json()
}

// ── Extract URL from text ────────────────────────────────────
function extractURL(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const matches = text.match(urlRegex)
  return matches ? matches[0] : null
}

// ── AI Summarize using Groq ──────────────────────────────────
async function summarizeWithAI(url, text) {
  const prompt = `You are an AI that organizes saved content for a second brain app.

Analyze this and return ONLY valid JSON with no extra text:
URL: ${url}
Additional text: ${text || 'none'}

Return this exact JSON:
{
  "title": "short descriptive title (max 60 chars)",
  "summary": "2-3 sentence summary",
  "category": "one of: tech, health, finance, travel, other",
  "tags": ["tag1", "tag2", "tag3"],
  "source": "one of: youtube, instagram, twitter, tiktok, article, whatsapp, other"
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3,
    }),
  })

  const data = await res.json()
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Groq error: ' + JSON.stringify(data))
  }

  const raw = data.choices[0].message.content.trim()
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

// ── Handle incoming WhatsApp message ────────────────────────
async function handleWhatsApp(from, body) {
  const text    = (body || '').trim()
  const phoneNo = from.replace('whatsapp:', '')

  // ── /start or hi/hello ───────────────────────────────────
  if (['hi', 'hello', 'start', '/start', 'hey'].includes(text.toLowerCase())) {
    await sendWhatsApp(from,
      `🧠 *Welcome to Cortex AI!*\n\n` +
      `I save any link to your second brain automatically.\n\n` +
      `*To get started:*\n` +
      `1. Go to your Cortex dashboard\n` +
      `2. Click *Connect WhatsApp*\n` +
      `3. Send me the code you receive\n\n` +
      `Then just send me any link — YouTube, Instagram, Twitter — and I'll organize it! ✨`
    )
    return
  }

  // ── Connect code (CORTEX-XXXXXX) ────────────────────────
  if (text.toUpperCase().startsWith('CORTEX-')) {
    const code = text.trim().toUpperCase()

    const { data: pending } = await supabase
      .from('whatsapp_pending')
      .select('user_id')
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!pending) {
      await sendWhatsApp(from,
        `❌ *Invalid or expired code.*\n\nGo to your Cortex dashboard and click *Connect WhatsApp* to get a fresh code.`
      )
      return
    }

    // Save connection
    await supabase.from('whatsapp_connections').upsert({
      phone:   phoneNo,
      user_id: pending.user_id,
    })

    // Delete used code
    await supabase.from('whatsapp_pending').delete().eq('code', code)

    await sendWhatsApp(from,
      `🎉 *Successfully connected to Cortex!*\n\n` +
      `You're all set! Just send me any link from Instagram, YouTube, TikTok, or anywhere — I'll save and organize it for you! 🧠✨`
    )
    return
  }

  // ── URL / link saving ────────────────────────────────────
  const url = extractURL(text)

  if (url) {
    // Check connection
    const { data: conn } = await supabase
      .from('whatsapp_connections')
      .select('user_id')
      .eq('phone', phoneNo)
      .single()

    if (!conn) {
      await sendWhatsApp(from,
        `❌ *Connect your Cortex account first!*\n\n` +
        `1. Go to your Cortex dashboard\n` +
        `2. Click *Connect WhatsApp*\n` +
        `3. Send me the code\n\nThen send this link again ✅`
      )
      return
    }

    await sendWhatsApp(from, `⏳ *Saving to your brain...*\n\n🔗 ${url}`)

    try {
      const aiData = await summarizeWithAI(url, text.replace(url, '').trim())

      const { error } = await supabase.from('saved_items').insert({
        user_id:  conn.user_id,
        url,
        title:    aiData.title,
        summary:  aiData.summary,
        category: aiData.category,
        tags:     aiData.tags,
        source:   'whatsapp',
      })

      if (error) throw error

      await supabase.from('notifications').insert({
        user_id: conn.user_id,
        title:   'Saved via WhatsApp! 💬',
        message: `"${aiData.title}" was saved to your brain.`,
        type:    'success',
      })

      const categoryEmoji = {
        tech: '💻', health: '💪', finance: '💰', travel: '✈️', other: '📌'
      }

      await sendWhatsApp(from,
        `✅ *Saved to your Cortex brain!*\n\n` +
        `📝 *${aiData.title}*\n\n` +
        `📋 ${aiData.summary}\n\n` +
        `${categoryEmoji[aiData.category] || '📌'} Category: *${aiData.category}*\n` +
        `🏷️ Tags: ${aiData.tags.map(t => `#${t}`).join(' ')}\n\n` +
        `Open your Cortex dashboard to see it! 🧠`
      )
    } catch (err) {
      console.error('WhatsApp save error:', err)
      await sendWhatsApp(from, `❌ *Failed to save.*\n\nPlease try again or check the link is valid.`)
    }
    return
  }

  // ── Unknown ──────────────────────────────────────────────
  await sendWhatsApp(from,
    `🧠 Send me any link to save it to your Cortex brain!\n\nOr send *hi* to see instructions.`
  )
}

module.exports = { handleWhatsApp }
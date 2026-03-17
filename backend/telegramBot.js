// backend/telegramBot.js

const { createClient } = require('@supabase/supabase-js')

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SUPABASE_URL   = process.env.SUPABASE_URL
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_KEY
const GEMINI_KEY     = process.env.GEMINI_API_KEY
const WEBHOOK_URL    = process.env.BACKEND_URL

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Telegram API helper ──────────────────────────────────────
async function telegramAPI(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

// ── Send message ─────────────────────────────────────────────
async function sendMessage(chatId, text, extra = {}) {
  return telegramAPI('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...extra,
  })
}

// ── Extract URL ──────────────────────────────────────────────
function extractURL(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const matches = text.match(urlRegex)
  return matches ? matches[0] : null
}

// ── AI Summarize using FREE Gemini ───────────────────────────
async function summarizeWithAI(url, text) {
  const prompt = `You are an AI that organizes saved content for a second brain app.

Analyze this saved content and return ONLY valid JSON with no extra text:
URL: ${url}
Additional text: ${text || 'none'}

Return this exact JSON format:
{
  "title": "short descriptive title (max 60 chars)",
  "summary": "2-3 sentence summary of what this content is about",
  "category": "one of: tech, health, finance, travel, other",
  "tags": ["tag1", "tag2", "tag3"],
  "source": "one of: youtube, instagram, twitter, tiktok, article, other"
}`

  // ✅ FREE Groq API
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
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
    throw new Error('Groq returned no response: ' + JSON.stringify(data))
  }

  const raw = data.choices[0].message.content.trim()
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

// ── Handle incoming message ──────────────────────────────────
async function handleMessage(message) {
  const chatId        = message.chat.id
  const text          = message.text || ''
  const telegramUserId = message.from.id.toString()
  const firstName     = message.from.first_name || 'there'

  // /start
  if (text === '/start') {
    await sendMessage(chatId,
      `🧠 <b>Welcome to Cortex AI Bot!</b>\n\n` +
      `I save any link to your Cortex second brain automatically.\n\n` +
      `<b>To get started:</b>\n` +
      `1. Go to your Cortex dashboard\n` +
      `2. Click <b>Connect Telegram</b>\n` +
      `3. Send me the code you receive\n\n` +
      `Then just forward me any link — Instagram, YouTube, TikTok, articles — and I'll organize everything for you! ✨`
    )
    return
  }

  // /help
  if (text === '/help') {
    await sendMessage(chatId,
      `🧠 <b>Cortex Bot Help</b>\n\n` +
      `<b>Commands:</b>\n` +
      `/start — Welcome message\n` +
      `/status — Check your connection\n` +
      `/recent — See your last 5 saved items\n\n` +
      `<b>To save anything:</b>\n` +
      `Just send or forward any link to me! That's it. ✅`
    )
    return
  }

  // /status
  if (text === '/status') {
    const { data } = await supabase
      .from('telegram_connections')
      .select('user_id, created_at')
      .eq('telegram_id', telegramUserId)
      .single()

    if (data) {
      const { count } = await supabase
        .from('saved_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', data.user_id)
      await sendMessage(chatId,
        `✅ <b>Connected to Cortex!</b>\n\n` +
        `🧠 Total saved: <b>${count || 0} items</b>\n` +
        `📅 Connected since: ${new Date(data.created_at).toLocaleDateString()}`
      )
    } else {
      await sendMessage(chatId,
        `❌ <b>Not connected yet.</b>\n\n` +
        `Go to your Cortex dashboard and click <b>Connect Telegram</b> to get your code.`
      )
    }
    return
  }

  // /recent
  if (text === '/recent') {
    const { data: conn } = await supabase
      .from('telegram_connections')
      .select('user_id')
      .eq('telegram_id', telegramUserId)
      .single()

    if (!conn) {
      await sendMessage(chatId, '❌ Not connected. Send /start to begin.')
      return
    }

    const { data: items } = await supabase
      .from('saved_items')
      .select('title, category, created_at')
      .eq('user_id', conn.user_id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!items?.length) {
      await sendMessage(chatId, '🧠 No items saved yet! Send me a link to get started.')
      return
    }

    const list = items.map((item, i) =>
      `${i + 1}. <b>${item.title}</b>\n   📁 ${item.category} · ${new Date(item.created_at).toLocaleDateString()}`
    ).join('\n\n')

    await sendMessage(chatId, `🧠 <b>Your recent saves:</b>\n\n${list}`)
    return
  }

  // CORTEX-XXXXXX connect code
  if (text.startsWith('CORTEX-')) {
    const code = text.trim().toUpperCase()

    const { data: pending } = await supabase
      .from('telegram_pending')
      .select('user_id')
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!pending) {
      await sendMessage(chatId,
        `❌ <b>Invalid or expired code.</b>\n\n` +
        `Go to your Cortex dashboard and click <b>Connect Telegram</b> to get a fresh code.`
      )
      return
    }

    await supabase.from('telegram_connections').upsert({
      telegram_id:   telegramUserId,
      telegram_name: firstName,
      user_id:       pending.user_id,
    })

    await supabase.from('telegram_pending').delete().eq('code', code)

    await sendMessage(chatId,
      `🎉 <b>Successfully connected to Cortex!</b>\n\n` +
      `Hi ${firstName}! You're all set.\n\n` +
      `Just forward me any link from Instagram, YouTube, TikTok, or anywhere — I'll save and organize it in your brain automatically! 🧠✨`
    )
    return
  }

  // URL / link saving
  const url = extractURL(text)

  if (url) {
    const { data: conn } = await supabase
      .from('telegram_connections')
      .select('user_id')
      .eq('telegram_id', telegramUserId)
      .single()

    if (!conn) {
      await sendMessage(chatId,
        `❌ <b>Connect your Cortex account first!</b>\n\n` +
        `1. Go to your Cortex dashboard\n` +
        `2. Click <b>Connect Telegram</b>\n` +
        `3. Send me the code\n\n` +
        `Then send this link again ✅`
      )
      return
    }

    await sendMessage(chatId, `⏳ <b>Saving to your brain...</b>\n\n🔗 ${url}`)

    try {
      const aiData = await summarizeWithAI(url, text.replace(url, '').trim())

      const { error } = await supabase.from('saved_items').insert({
        user_id:  conn.user_id,
        url,
        title:    aiData.title,
        summary:  aiData.summary,
        category: aiData.category,
        tags:     aiData.tags,
        source:   aiData.source || 'telegram',
      })

      if (error) throw error

      await supabase.from('notifications').insert({
        user_id: conn.user_id,
        title:   'Saved via Telegram! 📱',
        message: `"${aiData.title}" was saved to your brain.`,
        type:    'success',
      })

      const categoryEmoji = {
        tech: '💻', health: '💪', finance: '💰', travel: '✈️', other: '📌'
      }

      await sendMessage(chatId,
        `✅ <b>Saved to your Cortex brain!</b>\n\n` +
        `📝 <b>${aiData.title}</b>\n\n` +
        `📋 ${aiData.summary}\n\n` +
        `${categoryEmoji[aiData.category] || '📌'} Category: <b>${aiData.category}</b>\n` +
        `🏷️ Tags: ${aiData.tags.map(t => `#${t}`).join(' ')}\n\n` +
        `Open your Cortex dashboard to see it! 🧠`
      )
    } catch (err) {
      console.error('Save error:', err)
      await sendMessage(chatId,
        `❌ <b>Failed to save.</b>\n\nPlease try again or check the link is valid.`
      )
    }
    return
  }

  // Unknown message
  await sendMessage(chatId,
    `🧠 Send me any link to save it to your Cortex brain!\n\nOr use /help to see all commands.`
  )
}

// ── Set webhook ──────────────────────────────────────────────
async function setWebhook() {
  const webhookUrl = `${WEBHOOK_URL}/telegram/webhook`
  const result = await telegramAPI('setWebhook', { url: webhookUrl })
  console.log('✅ Telegram webhook set:', result)
}

// ── Process update ───────────────────────────────────────────
async function processUpdate(update) {
  if (update.message) {
    await handleMessage(update.message)
  }
}

module.exports = { setWebhook, processUpdate }
// backend/dailyDigest.js
// Sends daily recommendations via Telegram and WhatsApp

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const GROQ_KEY          = process.env.GROQ_API_KEY
const TELEGRAM_TOKEN    = process.env.TELEGRAM_BOT_TOKEN
const TWILIO_SID        = process.env.TWILIO_ACCOUNT_SID
const TWILIO_TOKEN      = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM       = process.env.TWILIO_WHATSAPP_FROM

// ── Generate digest using Groq ───────────────────────────────
async function generateDigest(items) {
  const topItems = items.slice(0, 15).map(i =>
    `- ${i.title} (${i.category}) tags: ${(i.tags || []).join(', ')}`
  ).join('\n')

  const prompt = `You are an AI assistant for a second brain app. Based on the user's saved content, generate a personalized daily digest.

User's saved items:
${topItems}

Generate a short, engaging daily digest message (max 200 words) that:
1. Highlights 2-3 interesting connections between their saved items
2. Suggests one thing they could learn or explore today based on their interests
3. Ends with an encouraging note

Keep it conversational, friendly and concise. No bullet points — write in paragraphs.`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.7,
    }),
  })

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ── Send Telegram message ────────────────────────────────────
async function sendTelegram(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

// ── Send WhatsApp message ────────────────────────────────────
async function sendWhatsApp(to, body) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
  const params = new URLSearchParams({
    From: TWILIO_FROM,
    To: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
    Body: body,
  })
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
    },
    body: params,
  })
}

// ── Main: send digest to all connected users ─────────────────
async function sendDailyDigest() {
  console.log('🧠 Starting daily digest...')

  try {
    // Get all Telegram connections
    const { data: telegramConns } = await supabase
      .from('telegram_connections')
      .select('user_id, telegram_id')

    // Get all WhatsApp connections
    const { data: whatsappConns } = await supabase
      .from('whatsapp_connections')
      .select('user_id, phone')

    // Collect all unique user IDs
    const userIds = [...new Set([
      ...(telegramConns || []).map(c => c.user_id),
      ...(whatsappConns || []).map(c => c.user_id),
    ])]

    console.log(`📤 Sending digest to ${userIds.length} users`)

    for (const userId of userIds) {
      try {
        // Get user's saved items
        const { data: items } = await supabase
          .from('saved_items')
          .select('title, category, tags, summary')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (!items || items.length < 3) continue // skip if too few items

        // Generate personalized digest
        const digest = await generateDigest(items)
        if (!digest) continue

        const message =
          `🧠 <b>Your Daily Cortex Digest</b>\n\n` +
          `${digest}\n\n` +
          `<i>You have ${items.length} ideas saved in your brain. Keep building! ✨</i>`

        // Send to Telegram
        const tgConn = (telegramConns || []).find(c => c.user_id === userId)
        if (tgConn) {
          await sendTelegram(tgConn.telegram_id, message)
          console.log(`✅ Telegram digest sent to user ${userId}`)
        }

        // Send to WhatsApp
        const waConn = (whatsappConns || []).find(c => c.user_id === userId)
        if (waConn) {
          const waMessage =
            `🧠 *Your Daily Cortex Digest*\n\n` +
            digest.replace(/<[^>]*>/g, '') + // strip HTML
            `\n\n_You have ${items.length} ideas saved. Keep building! ✨_`
          await sendWhatsApp(`whatsapp:${waConn.phone}`, waMessage)
          console.log(`✅ WhatsApp digest sent to user ${userId}`)
        }

        // Small delay between users
        await new Promise(r => setTimeout(r, 1000))

      } catch (err) {
        console.error(`Error sending digest to ${userId}:`, err.message)
      }
    }

    console.log('✅ Daily digest complete!')
  } catch (err) {
    console.error('Daily digest error:', err)
  }
}

module.exports = { sendDailyDigest }
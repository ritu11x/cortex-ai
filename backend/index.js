const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
require('dotenv').config()

const { handleWhatsApp } = require('./whatsappBot')
const { createClient } = require('@supabase/supabase-js')
const { processUpdate, setWebhook } = require('./telegramBot')

const app = express()

// ── Middleware ───────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// ── Existing routes ──────────────────────────────────────────
const fetchUrlRoute = require('./routes/fetchUrl')
const itemsRouter   = require('./routes/items')
const chatRouter    = require('./routes/chat')

app.use('/api/fetch-url', fetchUrlRoute)
app.use('/api/items', itemsRouter)
app.use('/api/chat', chatRouter)

// ── Supabase client ──────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// ── Health check ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Cortex API running! 🧠' })
})

// ── Telegram: webhook ────────────────────────────────────────
app.post('/telegram/webhook', async (req, res) => {
  res.sendStatus(200)
  try {
    await processUpdate(req.body)
  } catch (err) {
    console.error('Telegram webhook error:', err)
  }
})

// ── Telegram: generate connect code ─────────────────────────
app.post('/telegram/generate-code', async (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'userId required' })
  try {
    const code = 'CORTEX-' + crypto.randomBytes(3).toString('hex').toUpperCase()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await supabase.from('telegram_pending').upsert({
      user_id: userId, code, expires_at: expiresAt.toISOString(),
    })
    res.json({ code })
  } catch (err) {
    console.error('Generate code error:', err)
    res.status(500).json({ error: 'Failed to generate code' })
  }
})

// ── WhatsApp: webhook ────────────────────────────────────────
app.post('/whatsapp/webhook', async (req, res) => {
  res.sendStatus(200)
  try {
    const from = req.body.From
    const body = req.body.Body
    await handleWhatsApp(from, body)
  } catch (err) {
    console.error('WhatsApp webhook error:', err)
  }
})

// ── WhatsApp: generate connect code ─────────────────────────
app.post('/whatsapp/generate-code', async (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'userId required' })
  try {
    const code = 'CORTEX-' + crypto.randomBytes(3).toString('hex').toUpperCase()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await supabase.from('whatsapp_pending').upsert({
      user_id: userId, code, expires_at: expiresAt.toISOString(),
    })
    res.json({ code })
  } catch (err) {
    console.error('WhatsApp generate code error:', err)
    res.status(500).json({ error: 'Failed to generate code' })
  }
})

// ── Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, async () => {
  console.log(`✅ Cortex server running on port ${PORT}`)
  try {
    await setWebhook()
  } catch (err) {
    console.warn('Webhook setup failed:', err.message)
  }
})
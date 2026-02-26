 const express = require('express')
const router = express.Router()
const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

router.post('/', async (req, res) => {
  const { message, items } = req.body

  if (!message || !items) {
    return res.status(400).json({ error: 'Message and items required' })
  }

  // Build context from saved items
  const context = items.slice(0, 10).map((item, i) =>
    `Item ${i + 1}:
Title: ${item.title || 'Untitled'}
Category: ${item.category || 'other'}
Tags: ${(item.tags || []).join(', ')}
Summary: ${item.summary || 'No summary'}
Content: ${(item.content || '').slice(0, 200)}`
  ).join('\n\n---\n\n')

  const systemPrompt = `You are Miles AI, a smart second brain assistant. The user has ${items.length} saved items. Here they are:

${context}

Answer questions about their saved content, find connections, summarize topics, and generate ideas. Be concise and helpful.`

  try {
    console.log('Calling Claude API...')

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: systemPrompt,
      messages: [
        { role: 'user', content: message }
      ]
    })

    console.log('Claude responded successfully')
    const reply = response.content[0].text
    res.json({ reply })

  } catch (err) {
    console.error('Claude API Error:', err.message)
    console.error('Status:', err.status)
    console.error('Full:', JSON.stringify(err, null, 2))
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function summarizeAndTag(content, title, url) {
  const text = content || url || title || ''

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `Analyze this content and respond ONLY with valid JSON, no extra text:
{
  "summary": "2 sentence summary of the content",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "one of: tech, health, finance, travel, other",
  "title": "short title if none provided"
}

Content: ${text}
Title: ${title || 'none'}`
      }
    ]
  })

  const raw = message.content[0].text
  const json = JSON.parse(raw)
  return json
}

module.exports = { summarizeAndTag }
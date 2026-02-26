const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')
const { summarizeAndTag } = require('../services/claudeService')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

router.post('/save', async (req, res) => {
  const { title, content, url, type, user_id } = req.body

  try {
    // Get AI summary + tags from Claude
    const aiData = await summarizeAndTag(content, title, url)

    // Save to Supabase
    const { data, error } = await supabase.from('saved_items').insert({
      user_id,
      title: title || aiData.title || 'Untitled',
      content,
      url,
      source_type: type,
      summary: aiData.summary,
      tags: aiData.tags,
      category: aiData.category,
    }).select()

    if (error) throw error

    res.json({ success: true, item: data[0] })

  } catch (err) {
    console.error('Save error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params
  const { data, error } = await supabase
    .from('saved_items')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

module.exports = router
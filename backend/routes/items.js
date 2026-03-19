const express = require('express')
const router = express.Router()
const axios = require('axios')
const cheerio = require('cheerio')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const GROQ_KEY = process.env.GROQ_API_KEY

// ── Helpers (same as fetchUrl.js) ───────────────────────────
const detectPlatform = (url = '') => {
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('reddit.com')) return 'article'
  if (url.includes('linkedin.com')) return 'article'
  if (url.includes('medium.com')) return 'article'
  return 'link'
}

const getYouTubeId = (url) => {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

// ── Fetch real content from URL ──────────────────────────────
const fetchRealContent = async (url) => {
  if (!url) return {}
  const platform = detectPlatform(url)

  try {
    if (platform === 'youtube') {
      const videoId = getYouTubeId(url)
      // oEmbed for title + author (free, no API key)
      const oEmbed = await axios.get(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        { timeout: 6000 }
      )
      // Scrape page for description
      const page = await axios.get(url, {
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US,en;q=0.9' }
      })
      const $ = cheerio.load(page.data)
      const description =
        $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') || ''

      return {
        title:    oEmbed.data.title || '',
        author:   oEmbed.data.author_name || '',
        bodyText: `YouTube video by ${oEmbed.data.author_name}. ${description}`,
        image:    videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '',
        description,
      }
    } else {
      // General webpage
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        maxRedirects: 5,
      })
      const $ = cheerio.load(response.data)
      $('script, style, nav, footer, header, aside').remove()

      const getMeta = (prop) =>
        $(`meta[property="og:${prop}"]`).attr('content') ||
        $(`meta[name="${prop}"]`).attr('content') || ''

      const title       = getMeta('title') || $('title').text().trim() || ''
      const description = getMeta('description') || ''
      const image       = getMeta('image') || $('meta[property="og:image"]').attr('content') || ''
      const author      = $('meta[name="author"]').attr('content') || ''
      const keywords    = $('meta[name="keywords"]').attr('content') || ''

      // Extract main body text
      let bodyText = ''
      const articleEl = $('article, [role="main"], .post-content, .article-body, main')
      if (articleEl.length) {
        bodyText = articleEl.first().text().replace(/\s+/g, ' ').trim().slice(0, 3000)
      } else {
        bodyText = $('p').map((_, el) => $(el).text().trim()).get()
          .filter(t => t.length > 50).join(' ').slice(0, 3000)
      }

      return { title, description, image, author, keywords, bodyText }
    }
  } catch (err) {
    console.error('Content fetch error:', err.message)
    return {}
  }
}

// ── AI extract rich info using real content ──────────────────
const extractWithAI = async (contentData, url, userTitle, userContent) => {
  const platform = detectPlatform(url)

  const prompt = `You are an AI that extracts and organizes information for a second brain app.

Platform: ${platform}
URL: ${url}
Title: ${contentData.title || userTitle || ''}
Author: ${contentData.author || ''}
Description: ${contentData.description || ''}
Keywords: ${contentData.keywords || ''}
Main Content: ${contentData.bodyText || contentData.description || userContent || ''}
User Notes: ${userContent || ''}

Extract ALL important information and return ONLY valid JSON with no extra text:
{
  "title": "clean descriptive title (max 80 chars)",
  "summary": "comprehensive 3-5 sentence summary covering main points, key insights, and why this is valuable",
  "key_points": ["important point 1", "important point 2", "important point 3"],
  "category": "one of: tech, health, finance, travel, other",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "source": "${platform}"
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
      max_tokens: 800,
      temperature: 0.2,
    }),
  })

  const data = await res.json()
  if (!data.choices?.[0]?.message?.content) throw new Error('Groq error')

  const raw = data.choices[0].message.content.trim()
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

// ── POST /api/items/save ─────────────────────────────────────
router.post('/save', async (req, res) => {
  const { title, content, url, type, user_id } = req.body

  try {
    let contentData = {}
    let aiData = null

    // ✅ Step 1: Fetch real content from URL
    if (url) {
      console.log(`Fetching real content from: ${url}`)
      contentData = await fetchRealContent(url)
      console.log(`Fetched: title="${contentData.title?.slice(0,50)}" bodyText=${contentData.bodyText?.length || 0} chars`)
    }

    // ✅ Step 2: AI extract rich info from real content
    if (GROQ_KEY) {
      try {
        aiData = await extractWithAI(contentData, url || '', title, content)
        console.log(`AI extracted: category=${aiData.category} tags=${aiData.tags?.join(',')}`)
      } catch (err) {
        console.error('AI extraction failed:', err.message)
      }
    }

    // ✅ Step 3: Save to Supabase with rich data
    const platform = type || detectPlatform(url || '')
    const videoId = getYouTubeId(url || '')

    const { data, error } = await supabase.from('saved_items').insert({
      user_id,
      title:       aiData?.title    || title || contentData.title || 'Untitled',
      content:     content          || contentData.description || '',
      url:         url              || '',
      source_type: platform,
      source:      platform,
      summary:     aiData?.summary  || contentData.description?.slice(0, 300) || '',
      tags:        aiData?.tags     || [platform],
      category:    aiData?.category || 'other',
      // ✅ Store key points and thumbnail
      key_points:  aiData?.key_points || [],
      thumbnail:   contentData.image || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : ''),
      author:      contentData.author || '',
    }).select()

    if (error) throw error

    res.json({ success: true, item: data[0] })

  } catch (err) {
    console.error('Save error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/items/:user_id ──────────────────────────────────
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
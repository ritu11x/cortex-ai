const express = require('express')
const router = express.Router()
const axios = require('axios')
const cheerio = require('cheerio')

const GROQ_KEY = process.env.GROQ_API_KEY

// ── Detect platform ──────────────────────────────────────────
const detectPlatform = (url) => {
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('reddit.com')) return 'article'
  if (url.includes('linkedin.com')) return 'article'
  if (url.includes('medium.com')) return 'article'
  if (url.includes('substack.com')) return 'article'
  return 'link'
}

// ── Extract YouTube video ID ─────────────────────────────────
const getYouTubeId = (url) => {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

// ── Fetch YouTube data via oEmbed + page scraping ────────────
const fetchYouTubeData = async (url) => {
  const videoId = getYouTubeId(url)
  if (!videoId) return null

  try {
    // oEmbed gives us title and author for free
    const oEmbed = await axios.get(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { timeout: 5000 }
    )

    // Also scrape the page for description
    const page = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    })

    const $ = cheerio.load(page.data)

    // Extract description from meta tags
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      ''

    // Extract keywords/tags from meta
    const keywords = $('meta[name="keywords"]').attr('content') || ''

    return {
      title:       oEmbed.data.title || '',
      author:      oEmbed.data.author_name || '',
      description: description.slice(0, 1000),
      keywords,
      image:       `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      platform:    'youtube',
      videoId,
    }
  } catch (err) {
    console.error('YouTube fetch error:', err.message)
    return null
  }
}

// ── Fetch general webpage content ────────────────────────────
const fetchPageContent = async (url) => {
  const response = await axios.get(url, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    maxRedirects: 5,
  })

  const $ = cheerio.load(response.data)

  // Remove noise
  $('script, style, nav, footer, header, aside, .ads, #ads, .cookie, .popup, .modal').remove()

  const getMeta = (prop) =>
    $(`meta[property="og:${prop}"]`).attr('content') ||
    $(`meta[property="twitter:${prop}"]`).attr('content') ||
    $(`meta[name="og:${prop}"]`).attr('content') ||
    $(`meta[name="twitter:${prop}"]`).attr('content') ||
    $(`meta[name="${prop}"]`).attr('content') || ''

  const title       = getMeta('title') || $('title').text().trim() || ''
  const description = getMeta('description') || ''
  const image       = getMeta('image') || ''
  const siteName    = getMeta('site_name') || ''
  const keywords    = $('meta[name="keywords"]').attr('content') || ''
  const author      = $('meta[name="author"]').attr('content') ||
                      $('[rel="author"]').first().text().trim() || ''

  // ✅ Extract main article body text (up to 3000 chars)
  let bodyText = ''
  const articleEl = $('article, [role="main"], .post-content, .article-body, .entry-content, main')
  if (articleEl.length) {
    bodyText = articleEl.first().text().replace(/\s+/g, ' ').trim().slice(0, 3000)
  } else {
    bodyText = $('p').map((_, el) => $(el).text().trim()).get()
      .filter(t => t.length > 50).join(' ').slice(0, 3000)
  }

  return { title, description, image, siteName, keywords, author, bodyText }
}

// ── AI extract key info from content ─────────────────────────
const extractWithAI = async (contentData, url) => {
  const platform = detectPlatform(url)

  const prompt = `You are an AI that extracts and organizes information from web content for a second brain app.

Platform: ${platform}
URL: ${url}
Title: ${contentData.title}
Author: ${contentData.author || 'unknown'}
Description: ${contentData.description}
Keywords: ${contentData.keywords || ''}
Body Content: ${contentData.bodyText || contentData.description || ''}

Extract ALL important information and return ONLY valid JSON:
{
  "title": "clean, descriptive title (max 80 chars)",
  "summary": "comprehensive 3-5 sentence summary covering the main points, key insights, and what makes this valuable",
  "key_points": ["point 1", "point 2", "point 3"],
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
  if (!data.choices?.[0]?.message?.content) throw new Error('AI error')

  const raw = data.choices[0].message.content.trim()
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

// ── POST /api/fetch-url ───────────────────────────────────────
router.post('/', async (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'URL is required' })

  try { new URL(url) }
  catch { return res.status(400).json({ error: 'Invalid URL' }) }

  try {
    let contentData = {}
    const platform = detectPlatform(url)

    // ✅ Platform-specific extraction
    if (platform === 'youtube') {
      const ytData = await fetchYouTubeData(url)
      if (ytData) {
        contentData = {
          title:       ytData.title,
          description: ytData.description,
          author:      ytData.author,
          keywords:    ytData.keywords,
          image:       ytData.image,
          bodyText:    `YouTube video by ${ytData.author}. ${ytData.description}`,
        }
      }
    } else {
      // General page extraction
      try {
        contentData = await fetchPageContent(url)
      } catch (err) {
        console.error('Page fetch error:', err.message)
        contentData = { title: '', description: '', image: '', bodyText: '' }
      }
    }

    // ✅ Use AI to extract rich info if Groq key available
    let aiData = null
    if (GROQ_KEY && (contentData.title || contentData.description || contentData.bodyText)) {
      try {
        aiData = await extractWithAI(contentData, url)
      } catch (err) {
        console.error('AI extraction error:', err.message)
      }
    }

    // YouTube thumbnail
    if (platform === 'youtube') {
      const videoId = getYouTubeId(url)
      if (videoId) contentData.image = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    }

    return res.json({
      // Basic info
      title:       aiData?.title       || contentData.title?.slice(0, 200) || '',
      description: contentData.description?.slice(0, 500) || '',
      image:       contentData.image   || '',
      site_name:   contentData.siteName || '',
      source_type: platform,
      url,

      // ✅ AI-extracted rich info
      ai_summary:   aiData?.summary    || '',
      ai_tags:      aiData?.tags       || [],
      ai_category:  aiData?.category   || 'other',
      ai_keyPoints: aiData?.key_points || [],
      author:       contentData.author || '',
    })

  } catch (err) {
    console.error('fetchUrl error:', err.message)
    return res.json({
      title: '', description: '', image: '',
      source_type: detectPlatform(url),
      url,
      error: 'Could not fetch page info',
    })
  }
})

module.exports = router
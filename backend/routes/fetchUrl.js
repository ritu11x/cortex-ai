const express = require('express')
const router = express.Router()
const axios = require('axios')
const cheerio = require('cheerio')

// ✅ Detect platform from URL
const detectPlatform = (url) => {
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('whatsapp.com')) return 'whatsapp'
  if (url.includes('reddit.com')) return 'link'
  if (url.includes('linkedin.com')) return 'link'
  if (url.includes('spotify.com')) return 'link'
  return 'link'
}

// POST /api/fetch-url
router.post('/', async (req, res) => {
  const { url } = req.body

  if (!url) return res.status(400).json({ error: 'URL is required' })

  try { new URL(url) }
  catch { return res.status(400).json({ error: 'Invalid URL' }) }

  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      maxRedirects: 5,
    })

    const $ = cheerio.load(response.data)

    const getMeta = (property) =>
      $(`meta[property="og:${property}"]`).attr('content') ||
      $(`meta[property="twitter:${property}"]`).attr('content') ||
      $(`meta[name="og:${property}"]`).attr('content') ||
      $(`meta[name="twitter:${property}"]`).attr('content') ||
      $(`meta[name="${property}"]`).attr('content') ||
      null

    const title       = getMeta('title') || $('title').text().trim() || ''
    const description = getMeta('description') || ''
    const siteName    = getMeta('site_name') || ''
    let   image       = getMeta('image') || ''

    // ✅ YouTube — get HD thumbnail directly
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
      if (match) image = `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
    }

    return res.json({
      title:       title.slice(0, 200),
      description: description.slice(0, 500),
      image,
      site_name:   siteName,
      source_type: detectPlatform(url),
      url,
    })

  } catch (err) {
    console.error('fetchUrl error:', err.message)
    return res.json({
      title: '', description: '', image: '',
      source_type: detectPlatform(url),
      url,
      error: 'Could not fetch page info — please fill manually',
    })
  }
})

module.exports = router
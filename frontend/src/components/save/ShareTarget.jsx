import { useEffect, useState } from 'react'

export default function ShareTarget({ onReceived }) {
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    // Check if Web Share Target API is supported
    if (navigator.share) {
      setSupported(true)
    }

    // Check if app was opened via share
    const params = new URLSearchParams(window.location.search)
    const sharedUrl = params.get('url')
    const sharedTitle = params.get('title')
    const sharedText = params.get('text')

    if (sharedUrl || sharedText) {
      onReceived({
        url: sharedUrl,
        title: sharedTitle,
        content: sharedText,
      })
    }
  }, [])

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Save to Miles Clone',
        text: 'Check this out',
        url: window.location.href,
      })
    } catch (err) {
      console.log('Share cancelled')
    }
  }

  if (!supported) return null

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-purple-500/30 transition text-sm"
    >
      ↗ Share
    </button>
  )
}
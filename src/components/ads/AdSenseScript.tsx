import { useEffect } from 'react'

const ADSENSE_SRC = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'

function AdSenseScript() {
  const client = import.meta.env.VITE_ADSENSE_CLIENT?.trim()

  useEffect(() => {
    if (!client) return

    const existing = document.querySelector<HTMLScriptElement>('script[data-adsense="zetrun"]')
    if (existing) return

    const script = document.createElement('script')
    script.async = true
    script.src = `${ADSENSE_SRC}?client=${client}`
    script.crossOrigin = 'anonymous'
    script.dataset.adsense = 'zetrun'
    document.head.appendChild(script)
  }, [client])

  return null
}

export default AdSenseScript

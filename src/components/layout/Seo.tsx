import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

type SeoProps = {
  description: string
  image?: string
  keywords?: string[]
  noindex?: boolean
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>
  title: string
}

const SITE_NAME = 'zetrun'
const SITE_URL = 'https://zetrun.app'

const upsertMeta = (selector: string, key: string, content: string) => {
  let element = document.querySelector<HTMLMetaElement>(`meta[${selector}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(selector, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function Seo({ description, image = '/favicon.svg', keywords, noindex = false, structuredData, title }: SeoProps) {
  const location = useLocation()

  useEffect(() => {
    document.documentElement.lang = 'ko'
    document.title = `${title} | ${SITE_NAME}`

    const normalizedPath = location.pathname === '/' ? '/' : location.pathname.replace(/\/+$/, '')
    const canonicalUrl = `${SITE_URL}${normalizedPath}`
    const ogImage = image.startsWith('http') ? image : `${SITE_URL}${image}`

    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1')
    if (keywords?.length) {
      upsertMeta('name', 'keywords', keywords.join(', '))
    }
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', `${title} | ${SITE_NAME}`)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', ogImage)

    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:locale', 'ko_KR')
    upsertMeta('property', 'og:title', `${title} | ${SITE_NAME}`)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', canonicalUrl)
    upsertMeta('property', 'og:image', ogImage)

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl

    const defaultWebPageSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      description,
      inLanguage: 'ko-KR',
      name: `${title} | ${SITE_NAME}`,
      url: canonicalUrl,
    }

    const extraSchemas = Array.isArray(structuredData)
      ? structuredData
      : structuredData
        ? [structuredData]
        : []

    const payload = [defaultWebPageSchema, ...extraSchemas]

    let script = document.querySelector<HTMLScriptElement>('script[data-seo="zetrun"]')
    if (!script) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.dataset.seo = 'zetrun'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(payload)
  }, [description, image, keywords, location.pathname, noindex, structuredData, title])

  return null
}

export default Seo

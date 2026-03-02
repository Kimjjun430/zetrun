import { useEffect } from 'react'

type SeoProps = {
  description: string
  title: string
}

function Seo({ description, title }: SeoProps) {
  useEffect(() => {
    document.title = `${title} | zetrun`

    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', description)
    }
  }, [description, title])

  return null
}

export default Seo

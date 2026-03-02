import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

type AdSlotProps = {
  className?: string
  format?: 'auto' | 'fluid' | 'rectangle'
  slot?: string
}

function AdSlot({ className, format = 'auto', slot }: AdSlotProps) {
  const client = import.meta.env.VITE_ADSENSE_CLIENT?.trim()
  const adSlot = slot ?? import.meta.env.VITE_ADSENSE_SLOT?.trim()
  const pushedRef = useRef(false)

  useEffect(() => {
    if (!client || !adSlot || pushedRef.current) return

    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushedRef.current = true
    } catch {
      pushedRef.current = false
    }
  }, [adSlot, client])

  if (!client || !adSlot) {
    return null
  }

  return (
    <ins
      className={cn('adsbygoogle block overflow-hidden rounded-lg border border-slate-700/70 bg-slate-900/40', className)}
      style={{ display: 'block' }}
      data-ad-client={client}
      data-ad-slot={adSlot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  )
}

export default AdSlot

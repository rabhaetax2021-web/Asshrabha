"use client"

import { useEffect, useState } from 'react'

interface Props {
  initialLocale?: 'ar' | 'en'
}

const getCookieLocale = (): 'ar' | 'en' => {
  if (typeof document === 'undefined') return 'ar'
  const match = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)
  return (match ? decodeURIComponent(match[1]) : 'ar') as 'ar' | 'en'
}

export default function LocaleToggle({ initialLocale = 'ar' }: Props) {
  const [locale, setLocale] = useState<'ar' | 'en'>(initialLocale)

  useEffect(() => {
    const current = getCookieLocale()
    if (current && current !== locale) {
      setLocale(current)
    }
  }, [])

  const switchLocale = (next: 'ar' | 'en') => {
    if (typeof document === 'undefined') return
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    setLocale(next)
    window.location.reload()
  }

  return (
    <div className="lang-toggle" role="tablist" aria-label="Language">
      <button
        type="button"
        aria-label="Switch to Arabic"
        title="العربية"
        className={`btn btn-sm ${locale === 'ar' ? 'btn-primary' : 'btn-ghost'} lang-toggle-btn`}
        onClick={() => switchLocale('ar')}
        aria-pressed={locale === 'ar'}
      >
        AR
      </button>
      <button
        type="button"
        aria-label="Switch to English"
        title="English"
        className={`btn btn-sm ${locale === 'en' ? 'btn-primary' : 'btn-ghost'} lang-toggle-btn`}
        onClick={() => switchLocale('en')}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
    </div>
  )
}

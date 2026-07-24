import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import LocaleToggle from '@/components/shop/LocaleToggle'

describe('LocaleToggle', () => {
  it('uses the server-provided locale for the initial SSR markup', () => {
    const html = renderToString(React.createElement(LocaleToggle, { initialLocale: 'ar' }))

    // allow additional attributes/classes (aria-label, title, extra class)
    expect(html).toContain('aria-pressed="true">AR</button>')
    expect(html).toContain('aria-pressed="false">EN</button>')
  })
})

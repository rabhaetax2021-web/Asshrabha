import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function loadMessages(locale: string) {
  const filePath = join(process.cwd(), 'messages', `${locale}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

describe('translation bundles', () => {
  it('keeps the shop.price message available for the English locale', () => {
    const messages = loadMessages('en')
    expect(messages.shop.price).toBe('Price')
  })
})

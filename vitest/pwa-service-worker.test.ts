import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('service worker navigation handling', () => {
  it('does not intercept browser navigations', () => {
    const swPath = path.resolve(__dirname, '../public/sw.js')
    const swSource = readFileSync(swPath, 'utf8')

    expect(swSource).toContain("req.mode === 'navigate' || req.destination === 'document'")
    expect(swSource).toContain('return')
  })
})

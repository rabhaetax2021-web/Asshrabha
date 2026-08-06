import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { shouldRegisterServiceWorker } from '@/lib/pwa/service-worker'

describe('service worker navigation handling', () => {
  it('does not intercept browser navigations and uses versioned caches', () => {
    const swPath = path.resolve(__dirname, '../public/sw.js')
    const swSource = readFileSync(swPath, 'utf8')

    expect(swSource).toContain("req.mode === 'navigate' || req.destination === 'document'")
    expect(swSource).toContain('CACHE_VERSION')
    expect(swSource).toContain('SHELL_CACHE')
    expect(swSource).toContain('clients.claim')
    expect(swSource).toContain('return')
  })

  it('registers the worker for localhost in production while keeping remote hosts off', () => {
    expect(shouldRegisterServiceWorker('localhost', 'production')).toBe(true)
    expect(shouldRegisterServiceWorker('asshrabha.com', 'production')).toBe(false)
    expect(shouldRegisterServiceWorker('asshrabha.com', 'development')).toBe(true)
  })
})

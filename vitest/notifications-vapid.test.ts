import { describe, expect, it } from 'vitest'
import { getVapidPublicKey } from '../src/lib/notifications/vapid'

describe('getVapidPublicKey', () => {
  it('uses NEXT_PUBLIC_WAPID_PUBLIC_KEY when present', () => {
    const env = { NEXT_PUBLIC_WAPID_PUBLIC_KEY: 'wapid-key' } as NodeJS.ProcessEnv
    expect(getVapidPublicKey(env)).toBe('wapid-key')
  })

  it('falls back to the standard VAPID variable names', () => {
    const env = { VAPID_PUBLIC_KEY: 'vapid-key' } as NodeJS.ProcessEnv
    expect(getVapidPublicKey(env)).toBe('vapid-key')
  })

  it('reads lowercase deployment env names', () => {
    const env = { next_public_vapid_public_key: 'lowercase-key' } as NodeJS.ProcessEnv
    expect(getVapidPublicKey(env)).toBe('lowercase-key')
  })
})

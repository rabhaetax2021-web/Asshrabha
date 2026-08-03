import { describe, expect, it } from 'vitest'

const { buildAdminOnlySeed } = require('../src/lib/adminSeedData')

describe('buildAdminOnlySeed', () => {
  it('returns only an admin payload', () => {
    expect(buildAdminOnlySeed({ mobile: '900123456', password: 'secret', id: 'admin-1' })).toEqual({
      admin: { mobile: '900123456', password: 'secret', id: 'admin-1' },
      provider: null,
    })
  })

  it('omits the id when it is not provided', () => {
    expect(buildAdminOnlySeed({ mobile: '900123456', password: 'secret' })).toEqual({
      admin: { mobile: '900123456', password: 'secret' },
      provider: null,
    })
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../src/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('../src/lib/utils/permissions', () => ({
  isAdmin: vi.fn(),
}))

vi.mock('../src/lib/actions/approval.actions', () => ({
  listPendingApprovals: vi.fn(),
  applyApproval: vi.fn(),
}))

import { prisma } from '../src/lib/prisma'
import { getCurrentUser } from '../src/lib/auth'
import { isAdmin } from '../src/lib/utils/permissions'
import { listPendingApprovals, applyApproval } from '../src/lib/actions/approval.actions'
import { GET, POST } from '../src/app/api/admin/approvals/requests/route'

describe('Admin approvals API route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 403 when the caller is unauthenticated', async () => {
    ;(getCurrentUser as any).mockResolvedValue(null)
    const response = await GET()
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body).toEqual({ error: 'forbidden' })
  })

  it('returns pending approvals for admin users', async () => {
    ;(getCurrentUser as any).mockResolvedValue({ id: 'admin1', role: 'ROOT_ADMIN' })
    ;(isAdmin as any).mockReturnValue(true)
    ;(listPendingApprovals as any).mockResolvedValue([{ id: 'req1' }])

    const response = await GET()
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.items).toEqual([{ id: 'req1' }])
    expect(listPendingApprovals).toHaveBeenCalledWith(200)
  })

  it('forwards approve requests to applyApproval for admins', async () => {
    ;(getCurrentUser as any).mockResolvedValue({ id: 'admin1', role: 'ROOT_ADMIN' })
    ;(isAdmin as any).mockReturnValue(true)
    ;(applyApproval as any).mockResolvedValue({ ok: true })

    const request = {
      headers: { get: () => 'application/json' },
      json: async () => ({ id: 'req1', action: 'approve', comment: 'ok' }),
    } as any

    const response = await POST(request)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ ok: true })
    expect(applyApproval).toHaveBeenCalledWith('req1', 'admin1', true, 'ok')
  })

  it('returns unknown_action for unsupported actions', async () => {
    ;(getCurrentUser as any).mockResolvedValue({ id: 'admin1', role: 'ROOT_ADMIN' })
    ;(isAdmin as any).mockReturnValue(true)

    const request = {
      headers: { get: () => 'application/json' },
      json: async () => ({ id: 'req1', action: 'invalid' }),
    } as any

    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body).toEqual({ error: 'unknown_action' })
  })
})

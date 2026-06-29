import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { listPendingApprovals, applyApproval } from '@/lib/actions/approval.actions'
import { prisma } from '@/lib/prisma'

async function parseRequestBody(request: NextRequest) {
  const contentType = (request.headers.get('content-type') || '').toLowerCase()
  if (contentType.includes('application/json')) {
    return await request.json().catch(() => ({}))
  }
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const body: Record<string, string> = {}
    formData.forEach((value, key) => {
      body[key] = typeof value === 'string' ? value : value.toString()
    })
    return body
  }
  return {}
}

export async function GET() {
  const current = await getCurrentUser()
  if (!current || !isAdmin(current.role as any)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const items = await listPendingApprovals(200)
  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const current = await getCurrentUser()
  if (!current || !isAdmin(current.role as any)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const body = await parseRequestBody(request)
  const { id, action, comment } = body as any
  if (!id || !action) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  if (action === 'approve') {
    const res = await applyApproval(id, current.id, true, comment)
    return NextResponse.json(res)
  }
  if (action === 'reject') {
    const res = await applyApproval(id, current.id, false, comment)
    return NextResponse.json(res)
  }
  return NextResponse.json({ error: 'unknown_action' }, { status: 400 })
}

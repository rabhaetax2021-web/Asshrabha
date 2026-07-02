import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { applyProviderOrderModification } from '@/lib/provider/order-management'

export async function POST(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // provider user must own the provider profile
  const prov = await prisma.providerProfile.findUnique({ where: { userId: current.id }, select: { id: true } })
  if (!prov) return NextResponse.json({ error: 'not_a_provider' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const { action, orderItemId, newQuantity, reason } = body as any

  const result = await applyProviderOrderModification({
    providerId: prov.id,
    orderId,
    orderItemId,
    action,
    userId: current.id,
    newQuantity,
    reason,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'failed' }, { status: result.error === 'forbidden' ? 403 : result.error === 'invalid_item' ? 400 : result.error === 'invalid_quantity' ? 400 : 400 })
  }

  return NextResponse.json({ ok: true, item: result.item })
}

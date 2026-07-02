import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isProvider } from '@/lib/utils/permissions'
import { prisma } from '@/lib/prisma'
import { reRegisterProviderProduct } from '@/lib/provider/order-management'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentUser()
    if (!current || !isProvider(current.role as any)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { id } = await context.params
    const provider = await prisma.providerProfile.findUnique({ where: { userId: current.id }, select: { id: true } })
    if (!provider) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const result = await reRegisterProviderProduct({ providerId: provider.id, providerProductId: id, userId: current.id })
    if (!result.ok) return NextResponse.json({ error: result.error || 'failed' }, { status: 400 })

    return NextResponse.json({ ok: true, product: result.product })
  } catch (error) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

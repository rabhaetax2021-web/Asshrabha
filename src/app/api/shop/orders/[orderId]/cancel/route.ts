import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_req: Request, { params }: { params: Promise<{ orderId: string }> | { orderId: string } }) {
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Customers cannot cancel orders - only support/admin can
  return NextResponse.json({ error: 'Order cancellation must be done through support' }, { status: 403 })
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const cats = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json({ ok: true, categories: cats })
  } catch (err: unknown) {
    const msg = getErrorMessage(err)
    console.error('[api/shop/categories] error', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const cats = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json({ ok: true, categories: cats })
  } catch (err: any) {
    console.error('[api/shop/categories] error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getSlides } from '@/lib/heroSlides'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const slides = await getSlides()
    return NextResponse.json({ ok: true, slides })
  } catch (err: any) {
    console.error('[api/shop/hero] GET error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

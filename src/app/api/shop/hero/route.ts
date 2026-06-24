import { NextResponse } from 'next/server'
import { getSlides } from '@/lib/heroSlides'
import { getErrorMessage } from '@/lib/errors'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const slides = await getSlides()
    return NextResponse.json({ ok: true, slides })
  } catch (err: unknown) {
    const msg = getErrorMessage(err)
    console.error('[api/shop/hero] GET error', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

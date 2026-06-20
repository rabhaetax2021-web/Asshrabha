import { NextResponse } from 'next/server'
import { getSlides, saveSlides } from '@/lib/heroSlides'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current || !['ROOT_ADMIN', 'SUB_ADMIN'].includes(current.role)) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { action, slide } = body as any
    if (!action) return NextResponse.json({ ok: false, error: 'missing action' }, { status: 400 })

    const slides = await getSlides()

    if (action === 'create') {
      const id = String(Date.now())
      const item = { id, ...(slide || {}) }
      slides.unshift(item)
      await saveSlides(slides)
      return NextResponse.json({ ok: true, slides })
    }

    if (action === 'update') {
      if (!slide?.id) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 })
      const idx = slides.findIndex((s: any) => s.id === slide.id)
      if (idx === -1) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 })
      slides[idx] = { ...slides[idx], ...slide }
      await saveSlides(slides)
      return NextResponse.json({ ok: true, slides })
    }

    if (action === 'delete') {
      if (!slide?.id) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 })
      const filtered = slides.filter((s: any) => s.id !== slide.id)
      await saveSlides(filtered)
      return NextResponse.json({ ok: true, slides: filtered })
    }

    if (action === 'save') {
      const newSlides = (body as any).slides
      if (!Array.isArray(newSlides)) return NextResponse.json({ ok: false, error: 'missing slides' }, { status: 400 })
      await saveSlides(newSlides)
      return NextResponse.json({ ok: true, slides: newSlides })
    }

    return NextResponse.json({ ok: false, error: 'unknown action' }, { status: 400 })
  } catch (err: any) {
    console.error('[api/admin/hero] error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

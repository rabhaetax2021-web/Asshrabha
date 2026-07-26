import { NextRequest, NextResponse } from 'next/server'
import { getSlides, saveSlides } from '@/lib/heroSlides'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/errors'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current || !['ROOT_ADMIN', 'SUB_ADMIN'].includes(current.role)) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const action = body.action as string | undefined
    const slide = body.slide as Record<string, unknown> | undefined
    if (!action) return NextResponse.json({ ok: false, error: 'missing action' }, { status: 400 })

    const slides = await getSlides()

    if (action === 'create') {
      const item = { ...(slide || {}) }
      delete (item as Record<string, unknown>).id
      slides.unshift(item)
      await saveSlides(slides)
      return NextResponse.json({ ok: true, slides })
    }

    if (action === 'update') {
      const slideId = slide?.id as string | undefined
      if (!slideId) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 })
      const idx = slides.findIndex((s: Record<string, unknown>) => (s.id as string) === slideId)
      if (idx === -1) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 })
      slides[idx] = { ...slides[idx], ...slide }
      await saveSlides(slides)
      return NextResponse.json({ ok: true, slides })
    }

    if (action === 'delete') {
      const slideId = slide?.id as string | undefined
      if (!slideId) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 })
      const filtered = slides.filter((s: Record<string, unknown>) => (s.id as string) !== slideId)
      await saveSlides(filtered)
      return NextResponse.json({ ok: true, slides: filtered })
    }

    if (action === 'save') {
      const newSlides = (body as Record<string, unknown>).slides as unknown
      if (!Array.isArray(newSlides)) return NextResponse.json({ ok: false, error: 'missing slides' }, { status: 400 })
      await saveSlides(newSlides as Record<string, unknown>[])
      return NextResponse.json({ ok: true, slides: newSlides })
    }

    return NextResponse.json({ ok: false, error: 'unknown action' }, { status: 400 })
  } catch (err: unknown) {
    console.error('[api/admin/hero] error', getErrorMessage(err))
    return NextResponse.json({ ok: false, error: getErrorMessage(err) }, { status: 500 })
  }
}

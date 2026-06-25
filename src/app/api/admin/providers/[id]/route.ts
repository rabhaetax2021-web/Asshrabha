import { NextRequest, NextResponse } from 'next/server'
import { approveProvider, rejectProvider } from '@/lib/actions/admin.actions'
import { approveActionSchema } from '@/lib/validations/admin'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/errors'

export async function POST(request: NextRequest, context: { params: Promise<Record<string, unknown>> }) {
  try {
    const body = await request.json()
    const parsed = approveActionSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { action, note, adminUserId } = parsed.data
    // server-side auth: only approved admins can perform this
    const current = await getCurrentUser()
    if (!current || !['ROOT_ADMIN', 'SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const params = await context.params
    const id = params?.id as string | undefined
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    if (action === 'approve') {
      const result = await approveProvider(id, adminUserId, note);
      return NextResponse.json({ ok: true, result });
    }

    if (action === 'reject') {
      const result = await rejectProvider(id, adminUserId, note);
      return NextResponse.json({ ok: true, result });
    }

    if (action === 'suspend') {
      const suspendNote = (parsed.data as Record<string, unknown>)['suspendNote'] as string | undefined
      const result = await (await import('@/lib/actions/admin.actions')).suspendProvider(id, adminUserId, suspendNote || note)
      return NextResponse.json({ ok: true, result });
    }
    if (action === 'set_visibility') {
      const visible = (parsed.data as Record<string, unknown>)['visible'] as unknown
      if (typeof visible !== 'boolean') return NextResponse.json({ error: 'missing visible flag' }, { status: 400 })
      const result = await (await import('@/lib/actions/admin.actions')).setProviderVisibility(id, visible as boolean, adminUserId, note)
      return NextResponse.json({ ok: true, result });
    }

    if (action === 'set_location') {
      const lat = (parsed.data as Record<string, unknown>)['lat'] as number | undefined
      const lng = (parsed.data as Record<string, unknown>)['lng'] as number | undefined
      const mapsLink = (parsed.data as Record<string, unknown>)['mapsLink'] as string | undefined
      const locationAddress = (parsed.data as Record<string, unknown>)['locationAddress'] as string | undefined
      if (typeof lat !== 'number' || typeof lng !== 'number') return NextResponse.json({ error: 'missing lat/lng' }, { status: 400 })
      const result = await (await import('@/lib/actions/admin.actions')).setProviderLocation(id, lat, lng, adminUserId, locationAddress || null, mapsLink || null)
      return NextResponse.json({ ok: true, result });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

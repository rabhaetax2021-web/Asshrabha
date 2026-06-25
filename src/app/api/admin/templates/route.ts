import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'

const ALLOWED_KEYS = ['otp_en', 'TEMPLATE_OTP', 'TEMPLATE_Marketing_Msg']

export async function GET() {
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role as any)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const settings = await prisma.systemSetting.findMany({ where: { key: { in: ALLOWED_KEYS } } })
    const map: Record<string,string> = {}
    for (const s of settings) map[s.key] = s.value
    return NextResponse.json({ ok: true, templates: map })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role as any)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await req.json() as { key?: string; value?: string }
    const key = String(body.key || '')
    const value = body.value ?? ''
    if (!ALLOWED_KEYS.includes(key)) return NextResponse.json({ error: 'invalid_key' }, { status: 400 })

    const up = await prisma.systemSetting.upsert({ where: { key }, update: { value }, create: { key, value, description: 'Managed template' } })
    return NextResponse.json({ ok: true, key: up.key, value: up.value })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

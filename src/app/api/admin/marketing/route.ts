import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'

type Recipient = { id: string; mobile: string; nameEN?: string | null; nameAR?: string | null }

export async function GET() {
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role as any)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const providers = await prisma.user.findMany({ where: { role: 'PROVIDER' }, select: { id: true, mobile: true, nameEN: true, nameAR: true, createdAt: true } })
    const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, select: { id: true, mobile: true, nameEN: true, nameAR: true, createdAt: true } })

    return NextResponse.json({ ok: true, providers, customers })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role as any)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await req.json() as any
    const { recipients, filter, templateName, templateParams, message } = body

    let list: Recipient[] = []
    if (Array.isArray(recipients) && recipients.length > 0) {
      // recipients may be user ids or raw mobile numbers (with spaces/hyphens)
      const sample = recipients[0]
      if (typeof sample === 'string') {
        // decide if array contains mobile numbers by sanitizing first entry
        const cleanedSample = (sample as string).trim()
        const plus = cleanedSample.startsWith('+') ? '+' : ''
        const digits = cleanedSample.replace(/[^0-9]/g, '')
        if (digits.length >= 6) {
          // treat as mobile numbers
          list = (recipients as string[]).map(m => {
            const s = (m || '').trim()
            const p = s.startsWith('+') ? '+' : ''
            const d = s.replace(/[^0-9]/g, '')
            const mobile = p + d
            return { id: mobile, mobile }
          })
        } else {
          list = await prisma.user.findMany({ where: { id: { in: recipients } }, select: { id: true, mobile: true, nameEN: true, nameAR: true } })
        }
      } else {
        list = await prisma.user.findMany({ where: { id: { in: recipients } }, select: { id: true, mobile: true, nameEN: true, nameAR: true } })
      }
    } else if (filter === 'providers') {
      list = await prisma.user.findMany({ where: { role: 'PROVIDER' }, select: { id: true, mobile: true, nameEN: true, nameAR: true } })
    } else if (filter === 'customers') {
      list = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, select: { id: true, mobile: true, nameEN: true, nameAR: true } })
    } else if (filter === 'all') {
      list = await prisma.user.findMany({ select: { id: true, mobile: true, nameEN: true, nameAR: true } })
    } else {
      return NextResponse.json({ error: 'no recipients' }, { status: 400 })
    }

    // NOTE: actual WhatsApp/Meta sending integration is not implemented here.
    // This endpoint prepares the recipient list and returns counts so a background job
    // or external service can process the sending using the provided templateName/templateParams.

    return NextResponse.json({ ok: true, count: list.length, templateName: templateName || null, message: message || null })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

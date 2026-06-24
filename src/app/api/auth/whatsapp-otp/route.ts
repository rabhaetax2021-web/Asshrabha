import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateOTP } from '@/lib/utils/helpers'
import { OTP_EXPIRY_MINUTES, OTP_LENGTH } from '@/lib/utils/constants'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const userId = body.userId || null
    const mobile = (body.mobile || '').toString()

    // Resolve userId from mobile when necessary
    let uid = userId
    if (!uid) {
      if (!mobile) return NextResponse.json({ success: false, error: 'MISSING_USER_OR_MOBILE' }, { status: 400 })
      const user = await prisma.user.findUnique({ where: { mobile } })
      if (!user) return NextResponse.json({ success: false, error: 'USER_NOT_FOUND' }, { status: 404 })
      uid = user.id
    }

    // Basic rate limiting: check last OTP created recently for this user
    const recent = await prisma.oTPCode.findFirst({
      where: { userId: uid, verified: false },
      orderBy: { createdAt: 'desc' },
    })

    if (recent && recent.expiresAt > new Date(Date.now() + (OTP_EXPIRY_MINUTES - 1) * 60 * 1000)) {
      return NextResponse.json({ success: false, error: 'OTP_COOLDOWN' }, { status: 429 })
    }

    const code = generateOTP(OTP_LENGTH)

    await prisma.oTPCode.create({
      data: {
        userId: uid,
        code,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    })

    // Send via provider if configured (Meta / WhatsApp Cloud)
    try {
      if (process.env.WHATSAPP_PROVIDER === 'meta' && process.env.WHATSAPP_META_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
        const token = process.env.WHATSAPP_META_TOKEN
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
        const endpoint = `https://graph.facebook.com/v17.0/${phoneId}/messages`

        // Fetch template from SystemSetting if present
        let template = `Your Asshrabha verification code is: ${code}`
        try {
          const t = await prisma.systemSetting.findUnique({ where: { key: 'TEMPLATE_OTP' } })
          if (t?.value) template = t.value
        } catch (e) {
          // ignore
        }

        // Resolve recipient name if available
        let name = mobile
        try {
          const u = await prisma.user.findUnique({ where: { id: uid }, select: { nameEN: true, nameAR: true, mobile: true } })
          name = u?.nameEN || u?.nameAR || u?.mobile || mobile
        } catch (e) {
          // ignore
        }

        const bodyText = String(template).replace(/{{1}}/g, name).replace(/{{2}}/g, code).replace(/{{3}}/g, String(OTP_EXPIRY_MINUTES))

        const payload = {
          messaging_product: 'whatsapp',
          to: mobile || undefined,
          type: 'text',
          text: { body: bodyText },
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const errText = await res.text()
          console.error(`WhatsApp (Meta) send failed with status ${res.status}:`, errText)
        } else {
          console.log(`WhatsApp OTP sent successfully to ${mobile}`)
        }
      } else {
        console.warn('WhatsApp (Meta) not configured. WHATSAPP_PROVIDER, WHATSAPP_META_TOKEN, or WHATSAPP_PHONE_NUMBER_ID missing')
      }
    } catch (e) {
      console.error('WhatsApp (Meta) send error:', e)
    }

    return NextResponse.json({ success: true, message: 'OTP_SENT' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'SERVER_ERROR' }, { status: 500 })
  }
}

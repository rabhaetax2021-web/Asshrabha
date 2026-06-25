import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateOTP } from '@/lib/utils/helpers'
import { OTP_EXPIRY_MINUTES, OTP_LENGTH } from '@/lib/utils/constants'

/**
 * Normalize phone number to E.164 format
 * Assumes Egyptian mobile (20) if no country code
 */
function normalizePhoneToE164(mobile: string): string {
  let cleaned = mobile.replace(/\D/g, '')
  
  // If starts with 0 (Egyptian format), replace with 20
  if (cleaned.startsWith('0')) {
    cleaned = '20' + cleaned.substring(1)
  }
  // If doesn't have country code, assume Egypt (20)
  else if (!cleaned.startsWith('20') && !cleaned.startsWith('1')) {
    if (cleaned.length === 10) cleaned = '20' + cleaned // 10-digit without country code
  }
  
  return '+' + cleaned
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = body.userId || null
    let mobile = (body.mobile || '').toString().trim()

    console.log('[WhatsApp OTP] Received request:', { userId, mobile: mobile.substring(0, 5) + '***' })

    // Resolve userId from mobile when necessary
    let uid = userId
    if (!uid) {
      if (!mobile) {
        console.warn('[WhatsApp OTP] Missing userId and mobile')
        return NextResponse.json({ success: false, error: 'MISSING_USER_OR_MOBILE' }, { status: 400 })
      }
      const user = await prisma.user.findUnique({ where: { mobile } })
      if (!user) {
        console.warn('[WhatsApp OTP] User not found:', mobile)
        return NextResponse.json({ success: false, error: 'USER_NOT_FOUND' }, { status: 404 })
      }
      uid = user.id
    }

    // Basic rate limiting: check last OTP created recently for this user
    const recent = await prisma.oTPCode.findFirst({
      where: { userId: uid, verified: false },
      orderBy: { createdAt: 'desc' },
    })

    if (recent && recent.expiresAt > new Date(Date.now() + (OTP_EXPIRY_MINUTES - 1) * 60 * 1000)) {
      console.warn('[WhatsApp OTP] Rate limit: OTP already exists for user', uid)
      return NextResponse.json({ success: false, error: 'OTP_COOLDOWN' }, { status: 429 })
    }

    const code = generateOTP(OTP_LENGTH)
    console.log('[WhatsApp OTP] Generated OTP:', code, 'for user:', uid)

    const otpRecord = await prisma.oTPCode.create({
      data: {
        userId: uid,
        code,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    })
    console.log('[WhatsApp OTP] OTP saved to database:', otpRecord.id)

    // Get user mobile if only userId was provided
    if (!mobile) {
      const user = await prisma.user.findUnique({ where: { id: uid }, select: { mobile: true } })
      if (user) mobile = user.mobile
    }

    // Send via provider if configured (Meta / WhatsApp Cloud)
    let whatsappSent = false
    try {
      if (process.env.WHATSAPP_PROVIDER === 'meta' && process.env.WHATSAPP_META_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
        const token = process.env.WHATSAPP_META_TOKEN
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
        const endpoint = `https://graph.facebook.com/v17.0/${phoneId}/messages`

        // Normalize phone to E.164 format
        const recipientPhone = normalizePhoneToE164(mobile)
        console.log('[WhatsApp OTP] Normalized phone:', recipientPhone)

        // Fetch template from SystemSetting if present
        let template = 'OTP Code: {{1}}. This is your OTP for {{2}}. The OTP is valid for {{3}} minutes. Call {{4}} if you did not perform this request. For your security, do not share this code.\nExpires in {{3}} minutes.'
        try {
          const t = await prisma.systemSetting.findUnique({ where: { key: 'otp_en' } })
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

        // Replace template placeholders (same as in-app notification)
        // {{1}} = OTP code, {{2}} = app name, {{3}} = expiry minutes, {{4}} = support number
        const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Asshrabha'
        const supportNumber = process.env.SUPPORT_PHONE || '123-456-7890'
        const bodyText = String(template)
          .replace(/{{1}}/g, code)
          .replace(/{{2}}/g, appName)
          .replace(/{{3}}/g, String(OTP_EXPIRY_MINUTES))
          .replace(/{{4}}/g, supportNumber)

        console.log('[WhatsApp OTP] Message body:', bodyText.substring(0, 100) + '...')

        const payload = {
          messaging_product: 'whatsapp',
          to: recipientPhone,
          type: 'text',
          text: { body: bodyText },
        }

        console.log('[WhatsApp OTP] Sending payload:', JSON.stringify({ ...payload, to: recipientPhone }))

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const responseText = await res.text()
        console.log('[WhatsApp OTP] Response status:', res.status)
        console.log('[WhatsApp OTP] Response body:', responseText)

        if (!res.ok) {
          console.error(`[WhatsApp OTP] Send failed with status ${res.status}:`, responseText)
        } else {
          console.log(`[WhatsApp OTP] ✓ Successfully sent to ${recipientPhone}`)
          whatsappSent = true
        }
      } else {
        console.warn('[WhatsApp OTP] Not configured:', {
          provider: process.env.WHATSAPP_PROVIDER,
          hasToken: !!process.env.WHATSAPP_META_TOKEN,
          hasPhoneId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
        })
      }
    } catch (e) {
      console.error('[WhatsApp OTP] Send error:', e)
    }

    return NextResponse.json({
      success: true,
      message: 'OTP_SENT',
      debug: {
        otpId: otpRecord.id,
        whatsappSent,
        phone: mobile,
      },
    })
  } catch (err) {
    console.error('[WhatsApp OTP] Server error:', err)
    return NextResponse.json({ success: false, error: 'SERVER_ERROR' }, { status: 500 })
  }
}

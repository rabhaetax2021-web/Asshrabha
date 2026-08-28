import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const mode = params.get('hub.mode')
  const token = params.get('hub.verify_token')
  const challenge = params.get('hub.challenge')

  if (
    mode === 'subscribe' &&
    token &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN &&
    challenge
  ) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'WEBHOOK_VERIFICATION_FAILED' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    if (payload.object !== 'whatsapp_business_account') {
      return NextResponse.json({ error: 'INVALID_WEBHOOK_OBJECT' }, { status: 400 })
    }

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {}

        for (const status of value.statuses ?? []) {
          console.log('[WhatsApp Webhook] Message status:', {
            id: status.id,
            recipient: status.recipient_id,
            status: status.status,
            timestamp: status.timestamp,
            errors: status.errors,
          })
        }

        for (const message of value.messages ?? []) {
          console.log('[WhatsApp Webhook] Incoming message:', {
            id: message.id,
            from: message.from,
            type: message.type,
          })
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[WhatsApp Webhook] Invalid payload:', error)
    return NextResponse.json({ error: 'INVALID_WEBHOOK_PAYLOAD' }, { status: 400 })
  }
}

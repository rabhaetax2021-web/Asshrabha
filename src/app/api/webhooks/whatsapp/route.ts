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

        console.log('[WhatsApp Webhook] Event received:', {
          entryId: entry.id,
          field: change.field,
          phoneNumberId: value.metadata?.phone_number_id,
          displayPhoneNumber: value.metadata?.display_phone_number,
          statusCount: value.statuses?.length ?? 0,
          messageCount: value.messages?.length ?? 0,
        })

        for (const status of value.statuses ?? []) {
          const errors = status.errors ?? []
          const statusDetails = {
            status: status.status,
            recipient: status.recipient_id,
            messageId: status.id,
            timestamp: status.timestamp,
            errors,
            errorCodes: errors.map((error: { code?: number }) => error.code),
            errorTitles: errors.map((error: { title?: string }) => error.title),
            errorDetails: errors.map((error: { error_data?: { details?: string }; details?: string }) => error.error_data?.details ?? error.details),
          }

          if (status.status === 'failed') {
            console.error('[WhatsApp Webhook] Message delivery failed:', statusDetails)
          } else {
            console.log('[WhatsApp Webhook] Message delivery status:', statusDetails)
          }
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

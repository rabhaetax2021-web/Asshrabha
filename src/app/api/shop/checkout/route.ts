import { NextRequest, NextResponse } from 'next/server'
import { placeOrder } from '@/lib/actions/shop.actions'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { getErrorMessage } from '@/lib/errors'

const checkoutSchema = z.object({
  items: z.array(z.object({
    providerProductId: z.string().min(1),
    quantity: z.number().int().positive(),
    optionId: z.string().optional(),
  })),
  addressId: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'WALLET']).default('CASH'),
})

export async function POST(request: NextRequest) {
  try {
    // Get the actual logged-in user from session (never trust client-provided customerId)
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { items, addressId, paymentMethod } = parsed.data
    const localeHeader = request.headers.get('accept-language') || ''
    const locale = localeHeader.toLowerCase().includes('ar') ? 'ar' : 'en'
    const orders = await placeOrder(currentUser.id, items, addressId, paymentMethod, locale)
    return NextResponse.json({ ok: true, orders })
  } catch (err: unknown) {
    const msg = getErrorMessage(err)
    console.error('[checkout]', msg)
    
    // Check if error is an insufficient wallet balance error
    try {
      const parsed = JSON.parse(msg)
      if (parsed.code === 'insufficient_wallet_balance') {
        return NextResponse.json({
          error: parsed.messageEN,
          code: 'insufficient_wallet_balance'
        }, { status: 400 })
      }
    } catch (e) {
      // Not a JSON error, continue with normal error handling
    }
    
    const failureKeywords = ['required purchase conditions', 'did not meet', 'لم يحقق', 'الشروط المطلوبة']
    const status = failureKeywords.some((phrase) => msg.includes(phrase)) ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

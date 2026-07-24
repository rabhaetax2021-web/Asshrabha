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

    const { items, addressId } = parsed.data
    const localeHeader = request.headers.get('accept-language') || ''
    const locale = localeHeader.toLowerCase().includes('ar') ? 'ar' : 'en'
    const orders = await placeOrder(currentUser.id, items, addressId, locale)
    return NextResponse.json({ ok: true, orders })
  } catch (err: unknown) {
    const msg = getErrorMessage(err)
    console.error('[checkout]', msg)
    const status = msg.includes('required purchase conditions') || msg.includes('did not meet') ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

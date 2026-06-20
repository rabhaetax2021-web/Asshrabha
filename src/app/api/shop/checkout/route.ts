import { NextResponse } from 'next/server'
import { placeOrder } from '@/lib/actions/shop.actions'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const checkoutSchema = z.object({
  items: z.array(z.object({
    providerProductId: z.string().min(1),
    quantity: z.number().int().positive(),
    optionId: z.string().optional(),
  })),
  addressId: z.string().optional(),
})

export async function POST(request: Request) {
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
    const orders = await placeOrder(currentUser.id, items, addressId)
    return NextResponse.json({ ok: true, orders })
  } catch (err: any) {
    console.error('[checkout]', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
      const form = await request.formData()
      const providerProductId = form.get('providerProductId') as string | null
      const catalogProductId = form.get('catalogProductId') as string | null
      const quantity = Number(form.get('quantity') || 1)

      let pp = null
      if (providerProductId) {
        pp = await prisma.providerProduct.findUnique({ where: { id: providerProductId } })
        if (!pp) return NextResponse.json({ error: 'Provider product not found' }, { status: 400 })
        // redirect to product page for providerProduct
        return NextResponse.redirect(new URL(`/shop/product/${pp.id}?addedProviderProduct=${pp.id}`, request.url))
      }

      if (catalogProductId) {
        // convert catalogProduct -> first providerProduct available
        pp = await prisma.providerProduct.findFirst({ where: { catalogProductId, status: 'APPROVED' } })
        if (!pp) return NextResponse.json({ error: 'No provider listing available for this product' }, { status: 400 })
        return NextResponse.redirect(new URL(`/shop/product/${catalogProductId}?addedProviderProduct=${pp.id}`, request.url))
      }

      return NextResponse.json({ error: 'missing product id' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

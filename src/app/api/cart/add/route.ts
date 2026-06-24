import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
      const form = await request.formData()
      const providerProductId = form.get('providerProductId') as string | null
      const catalogProductId = form.get('catalogProductId') as string | null
      const quantity = Number(form.get('quantity') || 1)

      let pp: any = null
      const optionId = form.get('optionId') as string | null
      const unitType = form.get('unitType') as string | null

      const current = await getCurrentUser()
      const buyerIsShop = !!current && current.role === 'PROVIDER'

      if (providerProductId) {
        pp = await prisma.providerProduct.findUnique({ where: { id: providerProductId }, include: { catalogProduct: true } })
        if (!pp) return NextResponse.json({ error: 'Provider product not found' }, { status: 400 })

        // if an explicit option is provided, prefer its price
        let option: any = null
        if (optionId) option = await prisma.providerProductOption.findUnique({ where: { id: optionId } })

        const unitPrice = option ? option.price : (buyerIsShop ? (pp.wholesalePrice ?? pp.sellingPrice) : (pp.retailPrice ?? pp.sellingPrice))

        return NextResponse.json({ ok: true, providerProduct: { id: pp.id, catalogProductId: pp.catalogProductId, unitPrice, title: pp.catalogProduct?.nameEN || pp.catalogProduct?.nameAR || null, quantity } })
      }

      if (catalogProductId) {
        // convert catalogProduct -> first providerProduct available
        pp = await prisma.providerProduct.findFirst({ where: { catalogProductId, status: 'APPROVED' }, include: { catalogProduct: true } })
        if (!pp) return NextResponse.json({ error: 'No provider listing available for this product' }, { status: 400 })

        // choose unit price based on buyer role
        const unitPrice = buyerIsShop ? (pp.wholesalePrice ?? pp.sellingPrice) : (pp.retailPrice ?? pp.sellingPrice)

        // return redirect target + computed price so client can navigate or add to local cart
        const redirectUrl = `/shop/product/${catalogProductId}?addedProviderProduct=${pp.id}`
        return NextResponse.json({ ok: true, redirect: redirectUrl, providerProductId: pp.id, unitPrice, title: pp.catalogProduct?.nameEN || pp.catalogProduct?.nameAR || null, quantity })
      }

      return NextResponse.json({ error: 'missing product id' }, { status: 400 })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

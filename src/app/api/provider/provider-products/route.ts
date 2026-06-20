import { NextResponse } from 'next/server'
import { createProviderProduct } from '@/lib/actions/provider.actions'
import { createProviderProductSchema } from '@/lib/validations/provider'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    let body: any = {}
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      body = await request.json()
    } else {
      const fd = await request.formData()
      fd.forEach((v, k) => {
        // formData values may be File or string
        body[k] = typeof v === 'string' ? v : v
      })
    }
    // coerce numeric fields when coming from form submissions
    if (body.sellingPrice !== undefined) body.sellingPrice = Number(body.sellingPrice)
    if (body.wholesalePrice !== undefined) body.wholesalePrice = Number(body.wholesalePrice)
    if (body.retailPrice !== undefined) body.retailPrice = Number(body.retailPrice)
    if (body.stockQuantity !== undefined) body.stockQuantity = Number(body.stockQuantity)
    const parsed = createProviderProductSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { providerId, catalogProductId, sellingPrice, wholesalePrice, retailPrice, stockQuantity, options } = parsed.data
    const current = await getCurrentUser()
    if (!current || current.role !== 'PROVIDER' || current.status !== 'APPROVED') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // Ensure the session user owns the providerId being modified
    const owner = await prisma.providerProfile.findUnique({ where: { id: providerId }, select: { userId: true } })
    if (!owner || owner.userId !== current.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const result = await createProviderProduct(providerId, catalogProductId, sellingPrice, Number(stockQuantity || 0), wholesalePrice, retailPrice, options || [])
    return NextResponse.json({ ok: true, result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

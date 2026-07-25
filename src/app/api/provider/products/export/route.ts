import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateProviderProductsWorkbook } from '@/lib/utils/excel-utils'

export async function GET(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current || current.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const provider = await prisma.providerProfile.findFirst({ where: { userId: current.id }, select: { id: true } })
    if (!provider) {
      return NextResponse.json({ error: 'provider not found' }, { status: 404 })
    }

    const products = await prisma.providerProduct.findMany({
      where: { providerId: provider.id },
      include: { catalogProduct: true },
      orderBy: { createdAt: 'desc' },
    })

    const buffer = await generateProviderProductsWorkbook(products as any)

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="provider-products.xlsx"',
      },
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

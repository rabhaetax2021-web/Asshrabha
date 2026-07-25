import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCsvTemplate } from '@/lib/utils/excel-utils'

function isAdminUser(current: Awaited<ReturnType<typeof getCurrentUser>>) {
  return !!current && ['ROOT_ADMIN', 'SUB_ADMIN'].includes(current.role) && current.status === 'APPROVED'
}

export async function GET(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!isAdminUser(current)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // Fetch all categories to include in template
    const categories = await prisma.category.findMany({
      select: { id: true, nameEN: true, nameAR: true },
      where: { isActive: true }
    })

    const csv = generateCsvTemplate(categories)

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="products-template.csv"'
      }
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/errors'
import { buildCategorySlug, getCategoryDeletionOutcome } from '@/lib/admin/category-management'

function isAdminUser(current: Awaited<ReturnType<typeof getCurrentUser>>) {
  return !!current && ['ROOT_ADMIN', 'SUB_ADMIN'].includes(current.role) && current.status === 'APPROVED'
}

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!isAdminUser(current)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { nameEN, nameAR, slug } = body
    if (!nameEN && !nameAR) return NextResponse.json({ error: 'missing name' }, { status: 400 })
    const finalSlug = buildCategorySlug(nameEN, nameAR, slug)

    const existing = await prisma.category.findUnique({ where: { slug: finalSlug } })
    if (existing) return NextResponse.json({ error: 'slug_taken' }, { status: 409 })

    const cat = await prisma.category.create({ data: { nameEN: nameEN || '', nameAR: nameAR || '', slug: finalSlug } })
    return NextResponse.json({ ok: true, id: cat.id })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!isAdminUser(current)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, nameEN, nameAR, slug } = body || {}
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
    if (!nameEN && !nameAR) return NextResponse.json({ error: 'missing name' }, { status: 400 })

    const currentCategory = await prisma.category.findUnique({ where: { id } })
    if (!currentCategory) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const nextSlug = buildCategorySlug(nameEN, nameAR, slug)
    if (nextSlug !== currentCategory.slug) {
      const existing = await prisma.category.findFirst({ where: { slug: nextSlug, id: { not: id } } })
      if (existing) return NextResponse.json({ error: 'slug_taken' }, { status: 409 })
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        nameEN: nameEN || '',
        nameAR: nameAR || '',
        slug: nextSlug,
      },
    })

    return NextResponse.json({ ok: true, category })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!isAdminUser(current)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, force } = body || {}
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    })

    if (!category) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const deletionOutcome = getCategoryDeletionOutcome({ productCount: category._count?.products ?? 0, force: Boolean(force) })
    if (!deletionOutcome.ok) {
      return NextResponse.json({ error: 'category_has_products' }, { status: 409 })
    }

    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

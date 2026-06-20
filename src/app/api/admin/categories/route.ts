import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current || !['ROOT_ADMIN', 'SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { nameEN, nameAR, slug } = body
    if (!nameEN && !nameAR) return NextResponse.json({ error: 'missing name' }, { status: 400 })
    const finalSlug = slug && typeof slug === 'string' ? slug : (nameEN || nameAR).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const existing = await prisma.category.findUnique({ where: { slug: finalSlug } })
    if (existing) return NextResponse.json({ error: 'slug_taken' }, { status: 409 })

    const cat = await prisma.category.create({ data: { nameEN: nameEN || '', nameAR: nameAR || '', slug: finalSlug } })
    return NextResponse.json({ ok: true, id: cat.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

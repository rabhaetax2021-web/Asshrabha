import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role as any)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const admins = await prisma.user.findMany({ where: { role: { in: ['ROOT_ADMIN', 'SUB_ADMIN'] } }, orderBy: { createdAt: 'desc' }, include: { permissions: true } })
    const out = admins.map(a => ({ id: a.id, mobile: a.mobile, nameEN: a.nameEN, nameAR: a.nameAR, role: a.role, status: a.status, createdAt: a.createdAt, permissions: a.permissions?.map(p => p.permission) }))
    return NextResponse.json({ ok: true, admins: out })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role as any)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await request.json() as Record<string, unknown>
    const mobile = String(body.mobile || '').trim()
    const nameEN = body.nameEN ? String(body.nameEN) : null
    const nameAR = body.nameAR ? String(body.nameAR) : null
    const role = (String(body.role || 'SUB_ADMIN') || 'SUB_ADMIN').toUpperCase()
    let password = body.password ? String(body.password) : null

    if (!mobile) return NextResponse.json({ error: 'missing mobile' }, { status: 400 })
    if (!['ROOT_ADMIN', 'SUB_ADMIN'].includes(role)) return NextResponse.json({ error: 'invalid role' }, { status: 400 })

    // if password not provided, generate a random one
    if (!password) {
      password = Math.random().toString(36).slice(2, 10) + Math.floor(Math.random() * 90 + 10).toString()
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    // create user as approved (no verification needed)
    const user = await prisma.user.create({ data: { mobile, passwordHash: hash, nameEN, nameAR, role: role as any, status: 'APPROVED' } })

    return NextResponse.json({ ok: true, id: user.id, mobile: user.mobile, password })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role as any)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await request.json() as Record<string, unknown>
    const id = String(body.id || '').trim()
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    const updates: Record<string, any> = {}
    if (body.nameEN !== undefined) updates.nameEN = String(body.nameEN || '')
    if (body.nameAR !== undefined) updates.nameAR = body.nameAR !== null ? String(body.nameAR || '') : null
    if (body.role !== undefined) {
      const role = String(body.role || 'SUB_ADMIN').toUpperCase()
      if (!['ROOT_ADMIN', 'SUB_ADMIN'].includes(role)) return NextResponse.json({ error: 'invalid role' }, { status: 400 })
      updates.role = role as any
    }
    if (body.status !== undefined) {
      const status = String(body.status || '').toUpperCase()
      if (!['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'DISABLED'].includes(status)) return NextResponse.json({ error: 'invalid status' }, { status: 400 })
      updates.status = status as any
    }
    if (body.password !== undefined && body.password !== null) {
      const password = String(body.password || '').trim()
      if (password.length > 0) {
        const salt = await bcrypt.genSalt(10)
        updates.passwordHash = await bcrypt.hash(password, salt)
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'no updates provided' }, { status: 400 })
    }

    const user = await prisma.user.update({ where: { id }, data: updates })
    return NextResponse.json({ ok: true, user: { id: user.id, mobile: user.mobile, nameEN: user.nameEN, nameAR: user.nameAR, role: user.role, status: user.status } })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role as any)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await request.json() as Record<string, unknown>
    const id = String(body.id || '').trim()
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
    if (current.id === id) return NextResponse.json({ error: 'cannot delete current admin' }, { status: 400 })

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ error: 'user not found' }, { status: 404 })

    // Allow ROOT_ADMIN to delete anyone except themselves.
    // Non-root admins must not be able to delete other admin accounts.
    if (current.role !== 'ROOT_ADMIN') {
      if (target.role === 'ROOT_ADMIN' || target.role === 'SUB_ADMIN') {
        return NextResponse.json({ error: 'cannot delete another admin' }, { status: 400 })
      }
    }

    try {
      // If this user is a provider, remove provider-related data first to
      // avoid RESTRICT foreign-key violations (orders, products, suggestions, etc.)
      const profile = await prisma.providerProfile.findUnique({ where: { userId: id } })
      if (profile) {
        const pid = profile.id
        // delete provider orders (cascades to items and status history)
        await prisma.order.deleteMany({ where: { providerId: pid } })
        // delete provider products (providerProductOptions cascade per schema)
        await prisma.providerProduct.deleteMany({ where: { providerId: pid } })
        // delete other provider-related records
        await prisma.deliveryZone.deleteMany({ where: { providerId: pid } })
        await prisma.productSuggestion.deleteMany({ where: { providerId: pid } })
        await prisma.review.deleteMany({ where: { providerId: pid } })
        await prisma.providerProfileEdit.deleteMany({ where: { providerId: pid } })
        // remove the provider profile itself
        await prisma.providerProfile.delete({ where: { id: pid } })
      }

      // delete admin permissions and OTP codes
      if ((prisma as any)?.adminPermission?.deleteMany) {
        await (prisma as any).adminPermission.deleteMany({ where: { userId: id } })
      }
      if ((prisma as any)?.otpCode?.deleteMany) {
        await (prisma as any).otpCode.deleteMany({ where: { userId: id } })
      }

      // delete wallet (cascades to transactions/requests)
      if ((prisma as any)?.wallet?.deleteMany) {
        await (prisma as any).wallet.deleteMany({ where: { userId: id } })
      }

      // delete addresses
      if ((prisma as any)?.address?.deleteMany) {
        await (prisma as any).address.deleteMany({ where: { userId: id } })
      }

      // finally delete the user
      if ((prisma as any)?.user?.delete) {
        await (prisma as any).user.delete({ where: { id } })
      } else {
        throw new Error('Prisma client user model not available')
      }
    } catch (e) {
      console.error('Failed deleting related records', e)
      return NextResponse.json({ error: String(e) }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

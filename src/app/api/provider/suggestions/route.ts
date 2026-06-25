import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'
import { createSuggestionSchema } from '@/lib/validations/provider'

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current || current.role !== 'PROVIDER' || current.status !== 'APPROVED') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await request.json() as Record<string, unknown>
    const parsed = createSuggestionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const provider = await prisma.providerProfile.findUnique({ where: { userId: current.id }, select: { id: true } })
    if (!provider) return NextResponse.json({ error: 'provider profile not found' }, { status: 400 })

    const suggestion = await prisma.productSuggestion.create({
      data: {
        providerId: provider.id,
        nameEN: parsed.data.nameEN,
        nameAR: parsed.data.nameAR,
        descriptionEN: parsed.data.descriptionEN || null,
        descriptionAR: parsed.data.descriptionAR || null,
        images: parsed.data.images || [],
        categorySuggestion: parsed.data.categorySuggestion || null,
      },
    })

    return NextResponse.json({ ok: true, suggestion })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

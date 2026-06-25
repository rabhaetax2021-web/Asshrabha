import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'
import { randomUUID } from 'crypto'
import path from 'path'
import { uploadToMinIO } from '@/lib/minio'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const origName = (file as any).name ?? 'avatar'
    const ext = path.extname(origName) || ''
    const safeExt = ext.replace(/[^.a-zA-Z0-9]/g, '')
    const filename = `${Date.now()}-${randomUUID()}${safeExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Determine content type
    const contentType = file.type || 'application/octet-stream'

    // Upload to MinIO (using 'avatars' as category prefix)
    const publicPath = await uploadToMinIO(filename, buffer, contentType, 'avatars')

    // persist to user.avatar
    await prisma.user.update({ where: { id: current.id }, data: { avatar: publicPath } })

    return NextResponse.json({ ok: true, path: publicPath, filePath: publicPath })
  } catch (err: unknown) {
    console.error('[api/user/avatar] error', getErrorMessage(err))
    return NextResponse.json({ ok: false, error: getErrorMessage(err) }, { status: 500 })
  }
}

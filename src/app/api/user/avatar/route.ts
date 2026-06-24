import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

export async function POST(request: Request) {
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

    const publicRoot = path.resolve(process.cwd(), 'public')
    const uploadsDir = path.join(publicRoot, 'uploads')
    if (!fs.existsSync(uploadsDir)) await fs.promises.mkdir(uploadsDir, { recursive: true })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const publicFilePath = path.join(uploadsDir, filename)
    await fs.promises.writeFile(publicFilePath, buffer)

    const publicPath = '/' + path.relative(publicRoot, publicFilePath).replace(/\\/g, '/')

    // persist to user.avatar
    await prisma.user.update({ where: { id: current.id }, data: { avatar: publicPath } })

    return NextResponse.json({ ok: true, path: publicPath, filePath: publicFilePath })
  } catch (err: unknown) {
    console.error('[api/user/avatar] error', getErrorMessage(err))
    return NextResponse.json({ ok: false, error: getErrorMessage(err) }, { status: 500 })
  }
}

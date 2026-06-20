import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ ok: false, error: 'No file' }, { status: 400 })

    // create a unique, sanitized filename to avoid collisions
    const origName = (file as any).name ?? 'upload'
    const ext = path.extname(origName) || ''
    const safeExt = ext.replace(/[^.a-zA-Z0-9]/g, '')
    const filename = `${Date.now()}-${randomUUID()}${safeExt}`

    // Allow configuring uploads root via env var `UPLOADS_ROOT`.
    // If not set, default to `public/uploads`.
    const envRoot = process.env.UPLOADS_ROOT || ''
    const uploadsDir = envRoot
      ? path.resolve(process.cwd(), envRoot)
      : path.resolve(process.cwd(), 'public', 'uploads')

    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const filePath = path.join(uploadsDir, filename)
    await fs.promises.writeFile(filePath, buffer)

    // Ensure there's a copy inside public/uploads so the file is always web-accessible
    const publicRoot = path.resolve(process.cwd(), 'public')
    const publicUploads = path.join(publicRoot, 'uploads')
    if (!fs.existsSync(publicUploads)) await fs.promises.mkdir(publicUploads, { recursive: true })
    const publicFilePath = path.join(publicUploads, filename)
    try {
      // If original is already inside public, just point to it; otherwise copy
      let publicPath: string | null = null
      if (filePath.startsWith(publicRoot)) {
        publicPath = '/' + path.relative(publicRoot, filePath).replace(/\\/g, '/')
      } else {
        await fs.promises.copyFile(filePath, publicFilePath)
        publicPath = '/' + path.relative(publicRoot, publicFilePath).replace(/\\/g, '/')
      }

      return NextResponse.json({ ok: true, path: publicPath, filePath })
    } catch (copyErr) {
      console.error('[upload] copy to public failed', copyErr)
      // still return original absolute path so caller can handle
      return NextResponse.json({ ok: true, path: null, filePath })
    }
  } catch (err: any) {
    console.error('[upload] error', err)
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 })
  }
}

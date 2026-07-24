import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getErrorMessage } from '@/lib/errors'
import { uploadToMinIO } from '@/lib/minio'
import path from 'path'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    const contentLength = request.headers.get('content-length') || 'unknown'
    if (!contentType.includes('multipart/form-data')) {
      console.error('[upload] invalid content-type', { contentType, contentLength })
      return NextResponse.json({ ok: false, error: 'Invalid upload request content type. Expected multipart/form-data.' }, { status: 400 })
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch (err: unknown) {
      console.error('[upload] formData parse failure', {
        error: getErrorMessage(err),
        contentType,
        contentLength,
      })
      return NextResponse.json({ ok: false, error: 'Failed to parse multipart/form-data upload body.' }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ ok: false, error: 'No file' }, { status: 400 })

    // create a unique, sanitized filename to avoid collisions
    const origName = file instanceof File ? file.name : 'upload'
    const ext = path.extname(origName) || ''
    const safeExt = ext.replace(/[^.a-zA-Z0-9]/g, '')
    const filename = `${Date.now()}-${randomUUID()}${safeExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Determine content type for upload
    const uploadContentType = file.type || 'application/octet-stream'

    // Upload to MinIO (using 'uploads' as category prefix)
    const publicPath = await uploadToMinIO(filename, buffer, uploadContentType, 'uploads')

    return NextResponse.json({ ok: true, path: publicPath, filePath: publicPath })
  } catch (err: unknown) {
    const msg = getErrorMessage(err)
    console.error('[upload] error', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

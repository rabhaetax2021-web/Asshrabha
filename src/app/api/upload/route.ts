import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getErrorMessage } from '@/lib/errors'
import { createMinioUploadSignedUrl, uploadToMinIO } from '@/lib/minio'
import path from 'path'

export const runtime = 'nodejs'
export const requestSizeLimit = 100 * 1024 * 1024

type UploadFilePayload = {
  buffer: Buffer
  filename: string
  contentType: string
  category?: string
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    const contentLength = request.headers.get('content-length') || 'unknown'

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => null) as { filename?: string; contentType?: string; category?: string } | null
      if (!body?.filename || !body?.contentType) {
        return NextResponse.json({ ok: false, error: 'Missing filename or content type' }, { status: 400 })
      }

      const ext = path.extname(body.filename) || ''
      const safeExt = ext.replace(/[^.a-zA-Z0-9]/g, '')
      const filename = `${Date.now()}-${randomUUID()}${safeExt}`
      const category = body.category || 'uploads'

      try {
        const signedUpload = await createMinioUploadSignedUrl(filename, body.contentType, category)
        return NextResponse.json({ ok: true, path: signedUpload.publicUrl, uploadUrl: signedUpload.uploadUrl, key: signedUpload.key, publicUrl: signedUpload.publicUrl })
      } catch (error) {
        console.error('[upload] signed upload failed', error)
        return NextResponse.json({ ok: false, error: 'MinIO upload is not configured for this environment.' }, { status: 500 })
      }
    }

    if (!contentType.includes('multipart/form-data')) {
      console.error('[upload] invalid content-type', { contentType, contentLength })
      return NextResponse.json({ ok: false, error: 'Invalid upload request content type. Expected multipart/form-data or application/json.' }, { status: 400 })
    }

    const uploadFile = await getUploadFile(request)
    if (!uploadFile) {
      console.error('[upload] no file data after multipart parse', { contentType, contentLength })
      return NextResponse.json({ ok: false, error: 'No file' }, { status: 400 })
    }

    const ext = path.extname(uploadFile.filename) || ''
    const safeExt = ext.replace(/[^.a-zA-Z0-9]/g, '')
    const filename = `${Date.now()}-${randomUUID()}${safeExt}`
    const category = uploadFile.category || 'uploads'

    try {
      const publicPath = await uploadToMinIO(filename, uploadFile.buffer, uploadFile.contentType, category)
      return NextResponse.json({ ok: true, path: publicPath, publicUrl: publicPath })
    } catch (error) {
      console.error('[upload] upload failed', error)
      return NextResponse.json({ ok: false, error: 'Upload failed.' }, { status: 500 })
    }
  } catch (err: unknown) {
    const msg = getErrorMessage(err)
    console.error('[upload] error', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

async function getUploadFile(request: Request): Promise<UploadFilePayload | null> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = typeof formData.get('category') === 'string' ? String(formData.get('category')) : undefined
    if (!file) return null

    const origName = file instanceof File ? file.name : 'upload'
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentType = file.type || 'application/octet-stream'
    return { buffer, filename: origName, contentType, category }
  } catch (err: unknown) {
    console.error('[upload] formData parse failure, falling back to raw multipart parse', {
      error: getErrorMessage(err),
      contentType: request.headers.get('content-type') || '',
      contentLength: request.headers.get('content-length') || 'unknown',
    })
    const clone = typeof request.clone === 'function' ? request.clone() : request
    return parseMultipartFile(clone)
  }
}

async function parseMultipartFile(request: Request): Promise<UploadFilePayload | null> {
  const contentType = request.headers.get('content-type') || ''
  const boundary = extractBoundary(contentType)
  if (!boundary) {
    console.error('[upload] parseMultipartFile: no boundary in content-type', { contentType })
    return null
  }

  const raw = Buffer.from(await request.arrayBuffer())

  // Log a short preview to help debug Vercel/edge differences (do not log full binary)
  try {
    const preview = raw.slice(0, 1024).toString('utf-8').replace(/\r/g, '\\r').replace(/\n/g, '\\n')
    console.error('[upload] parseMultipartFile: raw preview', { length: raw.length, preview: preview.slice(0, 800) })
  } catch (e) {
    console.error('[upload] parseMultipartFile: failed to create preview', getErrorMessage(e))
  }

  // First attempt: strict Buffer-based search
  let result = parseFilePart(raw, boundary, 'file')
  if (result) return result

  // Fallback: try searching as UTF-8 string for boundary markers (some platforms include unexpected preamble)
  try {
    const text = raw.toString('utf-8')
    const b1 = `--${boundary}`
    const idx = text.indexOf(b1)
    if (idx !== -1) {
      const sliced = Buffer.from(text.slice(idx))
      result = parseFilePart(sliced, boundary, 'file')
      if (result) return result
    }
  } catch (e) {
    console.error('[upload] parseMultipartFile: utf8 fallback failed', getErrorMessage(e))
  }

  console.error('[upload] parseMultipartFile: failed to locate file part for boundary', { boundary, length: raw.length })
  return null
}

function extractBoundary(contentType: string): string | null {
  const match = /boundary=(?:("[^"]+")|([^;]+))/i.exec(contentType)
  if (!match) return null
  return (match[1] || match[2] || '').replace(/^"|"$/g, '')
}

function parseFilePart(raw: Buffer, boundary: string, fieldName: string): UploadFilePayload | null {
  const marker = Buffer.from(`--${boundary}`)
  let cursor = raw.indexOf(marker)
  if (cursor === -1) {
    // Try to skip common preamble (e.g., leading CRLF) and search again
    const alt = Buffer.from(`\r\n--${boundary}`)
    cursor = raw.indexOf(alt)
    if (cursor !== -1) cursor += 2 // position at `--boundary`
  }
  if (cursor === -1) return null

  while (cursor !== -1) {
    cursor += marker.length
    // skip optional CRLF after boundary
    if (raw[cursor] === 13 && raw[cursor + 1] === 10) cursor += 2
    // check for final boundary `--`
    if (raw[cursor] === 45 && raw[cursor + 1] === 45) break

    const nextBoundary = raw.indexOf(marker, cursor)
    if (nextBoundary === -1) break

    let partEnd = nextBoundary
    if (raw[partEnd - 2] === 13 && raw[partEnd - 1] === 10) partEnd -= 2
    const part = raw.slice(cursor, partEnd)
    const separator = Buffer.from('\r\n\r\n')
    const headerEnd = part.indexOf(separator)
    if (headerEnd === -1) {
      cursor = nextBoundary
      continue
    }

    const headerText = part.slice(0, headerEnd).toString('utf-8')
    const body = part.slice(headerEnd + separator.length)
    const headers = headerText.split('\r\n')
    const contentDispositionLine = headers.find((line) => line.toLowerCase().startsWith('content-disposition:'))
    if (!contentDispositionLine) {
      cursor = nextBoundary
      continue
    }

    const { name, filename } = parseContentDisposition(contentDispositionLine)
    if (name !== fieldName || !filename) {
      cursor = nextBoundary
      continue
    }

    const contentTypeLine = headers.find((line) => line.toLowerCase().startsWith('content-type:'))
    const contentType = contentTypeLine ? contentTypeLine.split(':')[1].trim() : 'application/octet-stream'
    return { buffer: body, filename, contentType }
  }

  return null
}

function parseContentDisposition(line: string): { name?: string; filename?: string } {
  const nameMatch = /name="([^"]*)"/i.exec(line)
  const filenameMatch = /filename="([^"]*)"/i.exec(line)
  return {
    name: nameMatch?.[1],
    filename: filenameMatch?.[1],
  }
}

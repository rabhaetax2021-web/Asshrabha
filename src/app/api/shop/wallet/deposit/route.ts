import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createDepositRequest } from '@/lib/actions/wallet.actions'
import { getErrorMessage } from '@/lib/errors'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    
    const formData = await request.formData()
    const amount = Number(formData.get('amount'))
    const methodId = formData.get('methodId') as string | undefined
    const proofFile = formData.get('proofScreenshot') as File | undefined

    if (!amount || amount <= 0) return NextResponse.json({ error: 'invalid amount' }, { status: 400 })
    if (!proofFile) return NextResponse.json({ error: 'proof screenshot required' }, { status: 400 })

    // Validate file type
    if (!proofFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'file must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (proofFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'file too large (max 5MB)' }, { status: 400 })
    }

    // Save file to public/uploads/wallet-proofs
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'wallet-proofs')
    await mkdir(uploadDir, { recursive: true })

    const timestamp = Date.now()
    const ext = proofFile.name.split('.').pop() || 'jpg'
    const filename = `${current.id}-${timestamp}.${ext}`
    const filepath = join(uploadDir, filename)

    const bytes = await proofFile.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    const screenshotPath = `/uploads/wallet-proofs/${filename}`
    const dr = await createDepositRequest(current.id, amount, methodId, screenshotPath)
    
    if (!dr) return NextResponse.json({ error: 'wallet not found' }, { status: 404 })
    return NextResponse.json({ ok: true, request: dr })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

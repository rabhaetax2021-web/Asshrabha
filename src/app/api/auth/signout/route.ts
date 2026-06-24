import { signOut } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { getErrorMessage } from '@/lib/errors'

export async function POST() {
  try {
    await signOut({ redirect: false })
    return NextResponse.json({ ok: true })
    } catch (err: unknown) {
      return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

import { signOut } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    await signOut({ redirect: false })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

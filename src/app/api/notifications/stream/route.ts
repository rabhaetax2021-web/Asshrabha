import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Minimal SSE placeholder: returns a plain JSON stream is not implemented in this demo
  return NextResponse.json({ ok: true, message: 'SSE endpoint placeholder' })
}

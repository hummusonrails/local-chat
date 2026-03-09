import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth — validate a password and return a session token.
 * The password is checked against AUTH_SECRET env var.
 * If valid, returns the secret itself as the token (simple shared secret auth).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })
  }

  const body = await req.json()
  const { password } = body

  if (password === secret) {
    return NextResponse.json({ token: secret })
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}

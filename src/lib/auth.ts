import { NextRequest, NextResponse } from 'next/server'

/**
 * Validate the auth token from the request.
 * The token is a simple shared secret set via AUTH_SECRET env var.
 * Sent as Bearer token in Authorization header.
 */
export function validateAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    // No auth configured — block all requests
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  if (token !== secret) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  return null // Auth passed
}

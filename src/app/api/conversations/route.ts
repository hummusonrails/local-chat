import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { validateAuth } from '@/lib/auth'

const KV_KEY = 'conversations'

/**
 * GET /api/conversations — load all conversations from Vercel KV.
 */
export async function GET(req: NextRequest) {
  const authError = validateAuth(req)
  if (authError) return authError

  try {
    const data = await kv.get(KV_KEY)
    return NextResponse.json(data || [])
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'KV error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PUT /api/conversations — save all conversations to Vercel KV.
 * Expects the full conversation array in the body.
 */
export async function PUT(req: NextRequest) {
  const authError = validateAuth(req)
  if (authError) return authError

  try {
    const conversations = await req.json()
    await kv.set(KV_KEY, conversations)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'KV error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/conversations — clear all conversations.
 */
export async function DELETE(req: NextRequest) {
  const authError = validateAuth(req)
  if (authError) return authError

  try {
    await kv.del(KV_KEY)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'KV error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

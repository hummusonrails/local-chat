import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/auth'

/**
 * GET /api/models — proxy model listing from LM Studio.
 */
export async function GET(req: NextRequest) {
  const authError = validateAuth(req)
  if (authError) return authError

  const lmstudioUrl = process.env.LMSTUDIO_URL
  if (!lmstudioUrl) {
    return NextResponse.json({ error: 'LM Studio URL not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(`${lmstudioUrl}/v1/models`, {
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `LM Studio ${res.status}` }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Cannot reach LM Studio' }, { status: 503 })
  }
}

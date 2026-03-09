import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/auth'

/**
 * POST /api/chat — proxy chat completions to LM Studio.
 * The LMSTUDIO_URL env var holds the Cloudflare tunnel URL.
 * This route ensures the tunnel URL never reaches the client.
 */
export async function POST(req: NextRequest) {
  const authError = validateAuth(req)
  if (authError) return authError

  const lmstudioUrl = process.env.LMSTUDIO_URL
  if (!lmstudioUrl) {
    return NextResponse.json({ error: 'LM Studio URL not configured' }, { status: 500 })
  }

  const body = await req.json()
  const stream = body.stream !== false

  const upstream = await fetch(`${lmstudioUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer lm-studio',
    },
    body: JSON.stringify(body),
  })

  if (!upstream.ok) {
    const err = await upstream.text()
    return NextResponse.json(
      { error: `LM Studio error ${upstream.status}: ${err}` },
      { status: upstream.status }
    )
  }

  if (!stream) {
    const data = await upstream.json()
    return NextResponse.json(data)
  }

  // Stream the SSE response through
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  ;(async () => {
    const reader = upstream.body?.getReader()
    if (!reader) { writer.close(); return }
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        await writer.write(value)
      }
    } finally {
      writer.close()
    }
  })()

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

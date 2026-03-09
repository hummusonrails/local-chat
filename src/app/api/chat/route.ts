import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/auth'

export const runtime = 'edge'

/**
 * POST /api/chat — proxy to LM Studio's native REST API.
 * Translates the client request to LM Studio's /api/v1/chat format,
 * which supports MCP tool integrations (Brave Search, GitHub, etc.).
 * The LMSTUDIO_URL env var holds the Cloudflare tunnel URL.
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

  // Build input for native API from OpenAI-style messages
  const input: Array<{ type: string; content?: string; data_url?: string }> = []
  let systemPrompt = ''

  for (const msg of body.messages || []) {
    if (msg.role === 'system') {
      systemPrompt += (systemPrompt ? '\n\n' : '') + (typeof msg.content === 'string' ? msg.content : '')
      continue
    }
    if (msg.role === 'user') {
      // Handle multimodal content (images + text)
      if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'image_url' && part.image_url?.url) {
            input.push({ type: 'image', data_url: part.image_url.url })
          } else if (part.type === 'text') {
            input.push({ type: 'message', content: part.text })
          }
        }
      } else {
        input.push({ type: 'message', content: msg.content })
      }
    } else if (msg.role === 'assistant') {
      // Include prior assistant messages as context
      input.push({ type: 'message', content: `[Assistant]: ${msg.content}` })
    }
  }

  // MCP integrations — all configured servers
  const integrations = [
    'mcp/brave-search',
    'mcp/fetch',
    'mcp/github',
    'mcp/notion',
    'mcp/filesystem',
  ]

  const nativeBody: Record<string, unknown> = {
    model: body.model,
    input,
    stream,
    integrations,
    temperature: body.temperature ?? 0.7,
    max_output_tokens: body.max_tokens ?? 4096,
  }

  if (systemPrompt) {
    nativeBody.system_prompt = systemPrompt
  }

  const upstream = await fetch(`${lmstudioUrl}/api/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(nativeBody),
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

  // Pass through the SSE stream from LM Studio's native API
  const readable = new ReadableStream({
    async start(controller) {
      const reader = upstream.body?.getReader()
      if (!reader) {
        controller.close()
        return
      }
      const encoder = new TextEncoder()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          controller.enqueue(value)
        }
      } catch {
        controller.enqueue(encoder.encode(`event: error\ndata: {"type":"error","error":{"message":"Stream interrupted"}}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

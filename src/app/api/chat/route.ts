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

  // Build input for native API from OpenAI-style messages.
  // The native API input accepts a string or array of {type:'text'|'image'} items.
  // For multi-turn conversations, we build a formatted string with conversation history,
  // and append any images from the latest user message.
  let systemPrompt = ''
  const conversationParts: string[] = []
  const images: Array<{ type: 'image'; data_url: string }> = []

  for (const msg of body.messages || []) {
    if (msg.role === 'system') {
      systemPrompt += (systemPrompt ? '\n\n' : '') + (typeof msg.content === 'string' ? msg.content : '')
      continue
    }

    const label = msg.role === 'user' ? 'User' : 'Assistant'
    if (Array.isArray(msg.content)) {
      // Multimodal: extract text and images
      const textParts: string[] = []
      for (const part of msg.content) {
        if (part.type === 'image_url' && part.image_url?.url) {
          images.push({ type: 'image', data_url: part.image_url.url })
        } else if (part.type === 'text') {
          textParts.push(part.text)
        }
      }
      if (textParts.length) conversationParts.push(`${label}: ${textParts.join(' ')}`)
    } else {
      conversationParts.push(`${label}: ${msg.content}`)
    }
  }

  // If single turn (just one user message), use string directly.
  // If multi-turn, format as conversation history.
  const messages = body.messages?.filter((m: { role: string }) => m.role !== 'system') || []
  let input: string | Array<{ type: string; text?: string; data_url?: string }>

  if (messages.length <= 1 && images.length === 0) {
    // Simple string input for single-turn
    const lastMsg = messages[0]
    input = typeof lastMsg?.content === 'string' ? lastMsg.content : conversationParts.join('\n\n')
  } else if (images.length > 0) {
    // Array input for image support
    const items: Array<{ type: string; text?: string; data_url?: string }> = []
    for (const img of images) {
      items.push(img)
    }
    items.push({ type: 'text', text: conversationParts.join('\n\n') })
    input = items
  } else {
    // Multi-turn: string with conversation history
    input = conversationParts.join('\n\n')
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

  let upstream = await fetch(`${lmstudioUrl}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nativeBody),
  })

  // If MCP plugins are denied (403), retry without integrations
  if (!upstream.ok) {
    const errText = await upstream.text()
    if (upstream.status === 403 && errText.includes('Permission denied to use plugin')) {
      delete nativeBody.integrations
      upstream = await fetch(`${lmstudioUrl}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nativeBody),
      })
    }
    if (!upstream.ok) {
      const err = upstream.bodyUsed ? errText : await upstream.text()
      return NextResponse.json(
        { error: `LM Studio error ${upstream.status}: ${err}` },
        { status: upstream.status }
      )
    }
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

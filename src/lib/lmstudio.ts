import { LMStudioModel, Message, Settings } from './types'

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

export async function fetchModels(token: string): Promise<LMStudioModel[]> {
  const res = await fetch('/api/models', {
    headers: authHeaders(token),
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`)
  const data = await res.json()
  return (data.data || []).filter((m: LMStudioModel) => !m.id.includes('embed'))
}

export async function* streamChat(
  messages: Message[],
  model: string,
  settings: Settings,
  token: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const apiMessages = []

  if (settings.customContext || settings.customInstructions) {
    let systemContent = ''
    if (settings.customContext) {
      systemContent += `About the user: ${settings.customContext}\n\n`
    }
    if (settings.customInstructions) {
      systemContent += `Response instructions: ${settings.customInstructions}`
    }
    apiMessages.push({ role: 'system', content: systemContent.trim() })
  }

  for (const msg of messages) {
    if (msg.role === 'system') continue
    if (msg.images && msg.images.length > 0) {
      apiMessages.push({
        role: msg.role,
        content: [
          ...msg.images.map(img => ({
            type: 'image_url' as const,
            image_url: { url: img },
          })),
          { type: 'text' as const, text: msg.content },
        ],
      })
    } else {
      apiMessages.push({ role: msg.role, content: msg.content })
    }
  }

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify({
      model,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: settings.streamResponses,
    }),
    signal,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Error ${res.status}: ${err}`)
  }

  if (!settings.streamResponses) {
    const data = await res.json()
    yield data.choices?.[0]?.message?.content || ''
    return
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''
  let readCount = 0
  let yieldCount = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      console.log('[STREAM] Reader done. reads=' + readCount + ' yields=' + yieldCount + ' remainingBuffer="' + buffer.substring(0, 100) + '"')
      break
    }
    readCount++

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') {
        console.log('[STREAM] Got [DONE]. reads=' + readCount + ' yields=' + yieldCount)
        return
      }

      try {
        const parsed = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) {
          yieldCount++
          if (yieldCount <= 3) console.log('[STREAM] yield #' + yieldCount + ': "' + delta.substring(0, 30) + '"')
          yield delta
        }
      } catch {
        // skip malformed chunks
      }
    }
  }
}

export async function checkConnection(token: string): Promise<boolean> {
  try {
    const res = await fetch('/api/models', {
      headers: authHeaders(token),
      signal: AbortSignal.timeout(10000),
    })
    return res.ok
  } catch {
    return false
  }
}

import { LMStudioModel, Message, Settings } from './types'

export async function fetchModels(baseUrl: string): Promise<LMStudioModel[]> {
  const res = await fetch(`${baseUrl}/v1/models`, {
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`)
  const data = await res.json()
  return (data.data || []).filter((m: LMStudioModel) => !m.id.includes('embed'))
}

export async function* streamChat(
  messages: Message[],
  model: string,
  settings: Settings,
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

  const res = await fetch(`${settings.lmstudioBaseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer lm-studio',
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
    throw new Error(`LM Studio error ${res.status}: ${err}`)
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

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') return

      try {
        const parsed = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) yield delta
      } catch {
        // skip malformed chunks
      }
    }
  }
}

export async function checkConnection(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/v1/models`, {
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
  }
}

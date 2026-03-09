import { LMStudioModel, Message, Settings, ToolCall } from './types'

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

/** Events yielded by the native LM Studio stream parser */
export type StreamEvent =
  | { type: 'delta'; content: string }
  | { type: 'tool_call_start'; tool: string; serverLabel?: string }
  | { type: 'tool_call_success'; tool: string; arguments: Record<string, unknown>; output: string; serverLabel?: string }
  | { type: 'tool_call_error'; tool: string; reason: string }
  | { type: 'done' }

/**
 * Stream chat via LM Studio's native /api/v1/chat endpoint.
 * Yields StreamEvent objects for message deltas and tool calls.
 */
export async function* streamChat(
  messages: Message[],
  model: string,
  settings: Settings,
  token: string,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
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
    // Non-streaming native API returns { output: [...] }
    for (const item of data.output || []) {
      if (item.type === 'message') {
        yield { type: 'delta', content: item.content || '' }
      } else if (item.type === 'tool_call') {
        yield {
          type: 'tool_call_start',
          tool: item.tool,
          serverLabel: item.provider_info?.server_label || item.provider_info?.plugin_id,
        }
        yield {
          type: 'tool_call_success',
          tool: item.tool,
          arguments: item.arguments || {},
          output: item.output || '',
          serverLabel: item.provider_info?.server_label || item.provider_info?.plugin_id,
        }
      }
    }
    yield { type: 'done' }
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

    // Parse named SSE events: "event: <type>\ndata: <json>\n\n"
    // Split on double-newline to get complete events
    const events = buffer.split('\n\n')
    buffer = events.pop() || '' // last item may be incomplete

    for (const rawEvent of events) {
      if (!rawEvent.trim()) continue

      let eventType = ''
      let eventData = ''

      for (const line of rawEvent.split('\n')) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim()
        } else if (line.startsWith('data: ')) {
          eventData += line.slice(6)
        } else if (line.startsWith('data:')) {
          eventData += line.slice(5)
        }
      }

      if (!eventData) continue

      try {
        const parsed = JSON.parse(eventData)

        switch (eventType || parsed.type) {
          case 'message.delta':
            if (parsed.content) {
              yield { type: 'delta', content: parsed.content }
            }
            break

          case 'tool_call.start':
            yield {
              type: 'tool_call_start',
              tool: parsed.tool,
              serverLabel: parsed.provider_info?.server_label || parsed.provider_info?.plugin_id,
            }
            break

          case 'tool_call.success':
            yield {
              type: 'tool_call_success',
              tool: parsed.tool,
              arguments: parsed.arguments || {},
              output: parsed.output || '',
              serverLabel: parsed.provider_info?.server_label || parsed.provider_info?.plugin_id,
            }
            break

          case 'tool_call.failure':
            yield {
              type: 'tool_call_error',
              tool: parsed.metadata?.tool_name || 'unknown',
              reason: parsed.reason || 'Tool call failed',
            }
            break

          case 'chat.end':
            yield { type: 'done' }
            return

          case 'error':
            throw new Error(parsed.error?.message || 'LM Studio stream error')

          // Ignore: chat.start, model_load.*, prompt_processing.*, reasoning.*, message.start, message.end, tool_call.arguments
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes('LM Studio')) throw e
        // skip malformed events
      }
    }
  }

  yield { type: 'done' }
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

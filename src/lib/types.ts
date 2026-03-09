export interface ToolCall {
  tool: string
  arguments: Record<string, unknown>
  output?: string
  status: 'calling' | 'success' | 'error'
  serverLabel?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  images?: string[] // base64 data URLs
  toolCalls?: ToolCall[]
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  model: string
  createdAt: number
  updatedAt: number
  archived: boolean
  pinned: boolean
}

export interface LMStudioModel {
  id: string
  object: string
  owned_by: string
}

export interface Settings {
  theme: 'light' | 'dark' | 'system'
  accentColor: string
  customInstructions: string
  customContext: string
  hapticFeedback: boolean
  sendOnEnter: boolean
  streamResponses: boolean
}

export type ConversationGroup = {
  label: string
  conversations: Conversation[]
}

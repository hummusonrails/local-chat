export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  images?: string[] // base64 data URLs
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
  lmstudioBaseUrl: string
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

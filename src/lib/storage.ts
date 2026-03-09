import { Conversation, Settings } from './types'
import { STORAGE_KEYS, DEFAULT_SETTINGS } from './constants'

export function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.conversations)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveConversations(conversations: Conversation[]) {
  localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(conversations))
}

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
}

export function loadActiveConversationId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEYS.activeConversation)
}

export function saveActiveConversationId(id: string | null) {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.activeConversation, id)
  } else {
    localStorage.removeItem(STORAGE_KEYS.activeConversation)
  }
}

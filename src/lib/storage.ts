import { Conversation, Settings } from './types'
import { STORAGE_KEYS, DEFAULT_SETTINGS } from './constants'

// --- Auth token (localStorage only) ---

export function loadAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEYS.authToken)
}

export function saveAuthToken(token: string) {
  localStorage.setItem(STORAGE_KEYS.authToken, token)
}

export function clearAuthToken() {
  localStorage.removeItem(STORAGE_KEYS.authToken)
}

// --- Settings (localStorage — not sensitive) ---

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

// --- Active conversation ID (localStorage) ---

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

// --- Conversations (Vercel KV via API) ---

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

export async function loadConversationsFromAPI(token: string): Promise<Conversation[]> {
  try {
    const res = await fetch('/api/conversations', { headers: authHeaders(token) })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export function saveConversationsToAPI(conversations: Conversation[], token: string) {
  // Debounce saves to avoid hammering KV on every keystroke
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    try {
      await fetch('/api/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify(conversations),
      })
    } catch {
      // Silent fail — data is also in memory
    }
  }, 1000)
}

export async function clearConversationsFromAPI(token: string) {
  await fetch('/api/conversations', {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

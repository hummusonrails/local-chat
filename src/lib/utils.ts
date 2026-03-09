import { Conversation, ConversationGroup } from './types'

export function groupConversations(conversations: Conversation[]): ConversationGroup[] {
  const now = Date.now()
  const dayMs = 86400000
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()

  const groups: Record<string, Conversation[]> = {
    'Pinned': [],
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
  }
  const monthGroups: Record<string, Conversation[]> = {}

  const visible = conversations.filter(c => !c.archived)

  for (const conv of visible) {
    if (conv.pinned) {
      groups['Pinned'].push(conv)
      continue
    }
    const age = now - conv.updatedAt
    if (conv.updatedAt >= todayMs) {
      groups['Today'].push(conv)
    } else if (conv.updatedAt >= todayMs - dayMs) {
      groups['Yesterday'].push(conv)
    } else if (age < 7 * dayMs) {
      groups['Previous 7 Days'].push(conv)
    } else if (age < 30 * dayMs) {
      groups['Previous 30 Days'].push(conv)
    } else {
      const date = new Date(conv.updatedAt)
      const key = date.toLocaleString('default', { month: 'long', year: 'numeric' })
      if (!monthGroups[key]) monthGroups[key] = []
      monthGroups[key].push(conv)
    }
  }

  const result: ConversationGroup[] = []
  for (const [label, convs] of Object.entries(groups)) {
    if (convs.length > 0) {
      result.push({ label, conversations: convs.sort((a, b) => b.updatedAt - a.updatedAt) })
    }
  }
  for (const [label, convs] of Object.entries(monthGroups)) {
    result.push({ label, conversations: convs.sort((a, b) => b.updatedAt - a.updatedAt) })
  }

  return result
}

export function haptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const durations = { light: 10, medium: 20, heavy: 40 }
    navigator.vibrate(durations[type])
  }
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

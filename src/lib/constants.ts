export const DEFAULT_SETTINGS = {
  lmstudioBaseUrl: 'http://localhost:1234',
  theme: 'dark' as const,
  accentColor: '#10A37F',
  customInstructions: '',
  customContext: '',
  hapticFeedback: true,
  sendOnEnter: true,
  streamResponses: true,
}

export const ACCENT_COLORS = [
  { name: 'Green', value: '#10A37F' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
]

export const STORAGE_KEYS = {
  conversations: 'localchat-conversations',
  settings: 'localchat-settings',
  activeConversation: 'localchat-active',
}

export const DEFAULT_SETTINGS = {
  theme: 'dark' as const,
  accentColor: '#D4A054',
  customInstructions: '',
  customContext: '',
  hapticFeedback: true,
  sendOnEnter: true,
  streamResponses: true,
}

export const ACCENT_COLORS = [
  { name: 'Amber', value: '#D4A054' },
  { name: 'Rose', value: '#D4737A' },
  { name: 'Violet', value: '#9B7AD8' },
  { name: 'Teal', value: '#50B8A6' },
  { name: 'Sky', value: '#5A9FD4' },
  { name: 'Coral', value: '#D47B5A' },
]

export const STORAGE_KEYS = {
  settings: 'sanctum-settings',
  activeConversation: 'sanctum-active',
  authToken: 'sanctum-auth',
}

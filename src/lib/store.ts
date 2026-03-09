import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { Conversation, Message, Settings, LMStudioModel } from './types'
import { DEFAULT_SETTINGS } from './constants'
import {
  loadConversations, saveConversations,
  loadSettings, saveSettings,
  loadActiveConversationId, saveActiveConversationId,
} from './storage'

interface AppState {
  // Conversations
  conversations: Conversation[]
  activeConversationId: string | null
  activeConversation: () => Conversation | null

  // Models
  models: LMStudioModel[]
  activeModel: string
  connected: boolean

  // Settings
  settings: Settings
  sidebarOpen: boolean
  settingsOpen: boolean
  modelPickerOpen: boolean

  // Streaming
  isStreaming: boolean
  streamingContent: string
  abortController: AbortController | null

  // Actions
  init: () => void
  setModels: (models: LMStudioModel[]) => void
  setActiveModel: (model: string) => void
  setConnected: (connected: boolean) => void
  setSidebarOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setModelPickerOpen: (open: boolean) => void
  updateSettings: (partial: Partial<Settings>) => void

  // Conversation actions
  createConversation: () => string
  setActiveConversation: (id: string | null) => void
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  archiveConversation: (id: string) => void
  pinConversation: (id: string) => void
  clearAllConversations: () => void

  // Message actions
  addMessage: (conversationId: string, message: Message) => void
  updateLastAssistantMessage: (conversationId: string, content: string) => void
  setStreaming: (streaming: boolean, content?: string, controller?: AbortController | null) => void
  appendStreamContent: (chunk: string) => void
  stopStreaming: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  activeConversation: () => {
    const { conversations, activeConversationId } = get()
    return conversations.find(c => c.id === activeConversationId) || null
  },

  models: [],
  activeModel: '',
  connected: false,

  settings: DEFAULT_SETTINGS,
  sidebarOpen: false,
  settingsOpen: false,
  modelPickerOpen: false,

  isStreaming: false,
  streamingContent: '',
  abortController: null,

  init: () => {
    const conversations = loadConversations()
    const settings = loadSettings()
    const activeId = loadActiveConversationId()
    set({ conversations, settings, activeConversationId: activeId })
  },

  setModels: (models) => set({ models }),
  setActiveModel: (model) => set({ activeModel: model }),
  setConnected: (connected) => set({ connected }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setModelPickerOpen: (open) => set({ modelPickerOpen: open }),

  updateSettings: (partial) => {
    const newSettings = { ...get().settings, ...partial }
    set({ settings: newSettings })
    saveSettings(newSettings)
  },

  createConversation: () => {
    const id = uuidv4()
    const conv: Conversation = {
      id,
      title: 'New chat',
      messages: [],
      model: get().activeModel,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      archived: false,
      pinned: false,
    }
    const updated = [conv, ...get().conversations]
    set({ conversations: updated, activeConversationId: id })
    saveConversations(updated)
    saveActiveConversationId(id)
    return id
  },

  setActiveConversation: (id) => {
    set({ activeConversationId: id, sidebarOpen: false })
    saveActiveConversationId(id)
  },

  deleteConversation: (id) => {
    const { conversations, activeConversationId } = get()
    const updated = conversations.filter(c => c.id !== id)
    const newActive = activeConversationId === id ? null : activeConversationId
    set({ conversations: updated, activeConversationId: newActive })
    saveConversations(updated)
    saveActiveConversationId(newActive)
  },

  renameConversation: (id, title) => {
    const updated = get().conversations.map(c =>
      c.id === id ? { ...c, title, updatedAt: Date.now() } : c
    )
    set({ conversations: updated })
    saveConversations(updated)
  },

  archiveConversation: (id) => {
    const updated = get().conversations.map(c =>
      c.id === id ? { ...c, archived: !c.archived, updatedAt: Date.now() } : c
    )
    set({ conversations: updated })
    saveConversations(updated)
  },

  pinConversation: (id) => {
    const updated = get().conversations.map(c =>
      c.id === id ? { ...c, pinned: !c.pinned, updatedAt: Date.now() } : c
    )
    set({ conversations: updated })
    saveConversations(updated)
  },

  clearAllConversations: () => {
    set({ conversations: [], activeConversationId: null })
    saveConversations([])
    saveActiveConversationId(null)
  },

  addMessage: (conversationId, message) => {
    const updated = get().conversations.map(c => {
      if (c.id !== conversationId) return c
      const messages = [...c.messages, message]
      // Auto-title from first user message
      const title = c.messages.length === 0 && message.role === 'user'
        ? message.content.slice(0, 60) + (message.content.length > 60 ? '...' : '')
        : c.title
      return { ...c, messages, title, updatedAt: Date.now() }
    })
    set({ conversations: updated })
    saveConversations(updated)
  },

  updateLastAssistantMessage: (conversationId, content) => {
    const updated = get().conversations.map(c => {
      if (c.id !== conversationId) return c
      const messages = [...c.messages]
      const lastIdx = messages.findLastIndex(m => m.role === 'assistant')
      if (lastIdx >= 0) {
        messages[lastIdx] = { ...messages[lastIdx], content }
      }
      return { ...c, messages, updatedAt: Date.now() }
    })
    set({ conversations: updated })
    saveConversations(updated)
  },

  setStreaming: (streaming, content = '', controller = null) => {
    set({ isStreaming: streaming, streamingContent: content || '', abortController: controller })
  },

  appendStreamContent: (chunk) => {
    set(state => ({ streamingContent: state.streamingContent + chunk }))
  },

  stopStreaming: () => {
    const { abortController } = get()
    if (abortController) abortController.abort()
    set({ isStreaming: false, abortController: null })
  },
}))

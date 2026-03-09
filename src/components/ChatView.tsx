'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAppStore } from '@/lib/store'
import { streamChat } from '@/lib/lmstudio'
import { haptic } from '@/lib/utils'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

export default function ChatView() {
  const {
    activeConversation, activeModel, settings, isStreaming, streamingContent,
    addMessage, setStreaming, appendStreamContent, updateLastAssistantMessage,
    createConversation, activeConversationId, connected, authToken,
  } = useAppStore()

  const [input, setInput] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [isRecording, setIsRecording] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const conv = activeConversation()

  // Auto-scroll during streaming
  useEffect(() => {
    if (autoScroll && (isStreaming || conv?.messages.length)) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [streamingContent, isStreaming, conv?.messages.length, autoScroll])

  // Detect manual scroll
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    setAutoScroll(isAtBottom)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 150) + 'px'
    }
  }, [input])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setAutoScroll(true)
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text && images.length === 0) return
    if (!connected) return
    if (isStreaming) return

    haptic('medium')

    let convId = activeConversationId
    if (!convId) {
      convId = createConversation()
    }

    const userMsg = {
      id: uuidv4(),
      role: 'user' as const,
      content: text,
      timestamp: Date.now(),
      images: images.length > 0 ? [...images] : undefined,
    }

    addMessage(convId, userMsg)
    setInput('')
    setImages([])
    setAutoScroll(true)

    // Get updated conversation
    const currentConv = useAppStore.getState().conversations.find(c => c.id === convId)
    if (!currentConv) return

    const assistantMsg = {
      id: uuidv4(),
      role: 'assistant' as const,
      content: '',
      timestamp: Date.now(),
    }
    addMessage(convId, assistantMsg)

    const controller = new AbortController()
    setStreaming(true, '', controller)

    try {
      let fullContent = ''
      for await (const chunk of streamChat(
        currentConv.messages.concat(userMsg),
        activeModel,
        settings,
        authToken!,
        controller.signal,
      )) {
        fullContent += chunk
        appendStreamContent(chunk)
        if (settings.hapticFeedback && fullContent.length % 20 === 0) {
          haptic('light')
        }
      }
      updateLastAssistantMessage(convId, fullContent)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        const current = useAppStore.getState().streamingContent
        if (current) updateLastAssistantMessage(convId, current)
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        updateLastAssistantMessage(convId, `Error: ${errorMsg}`)
      }
    } finally {
      setStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && settings.sendOnEnter) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages(prev => [...prev, ev.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return

    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionCtor) return

    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setInput(transcript)
    }

    recognition.onend = () => setIsRecording(false)
    recognition.onerror = () => setIsRecording(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
    haptic('medium')
  }

  const messages = conv?.messages || []

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-2"
      >
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round" />
                <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-primary mb-1">How can I help?</h2>
            <p className="text-sm text-tertiary max-w-[280px]">
              {connected
                ? `Using ${activeModel || 'local model'}`
                : 'Connect to LM Studio to start chatting'
              }
            </p>
          </div>
        )}

        <div className="max-w-[720px] mx-auto">
          {messages.map((msg, i) => {
            const isLastAssistant = i === messages.length - 1 && msg.role === 'assistant' && isStreaming
            return (
              <MessageBubble
                key={msg.id}
                message={isLastAssistant ? { ...msg, content: streamingContent } : msg}
                isStreaming={isLastAssistant}
              />
            )
          })}

          {isStreaming && messages.length > 0 && messages[messages.length - 1].role !== 'assistant' && (
            <TypingIndicator />
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {!autoScroll && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-4 w-9 h-9 rounded-full bg-surface border border-border shadow-lg flex items-center justify-center hover:bg-hover transition-colors z-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <div key={i} className="relative shrink-0">
              <img src={img} alt="" className="w-16 h-16 rounded-xl object-cover" />
              <button
                onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="px-3 pb-[env(safe-area-inset-bottom,8px)] pt-2">
        <div className="max-w-[720px] mx-auto flex items-end gap-2 bg-input border border-border rounded-3xl px-3 py-2 focus-within:border-accent transition-colors">
          {/* Attachment */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-hover transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Text input */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            rows={1}
            className="flex-1 bg-transparent text-[15px] text-primary placeholder:text-tertiary resize-none focus:outline-none max-h-[150px] py-1 leading-relaxed"
          />

          {/* Voice / Send */}
          {input.trim() || images.length > 0 ? (
            <button
              onClick={handleSend}
              disabled={isStreaming || !connected}
              className="shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center disabled:opacity-40 transition-all animate-scale-in"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          ) : isStreaming ? (
            <button
              onClick={() => useAppStore.getState().stopStreaming()}
              className="shrink-0 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center animate-scale-in"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={toggleVoice}
              className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isRecording ? 'bg-red-500' : 'hover:bg-hover'}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isRecording ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isRecording ? '' : 'text-secondary'}>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-center text-[10px] text-tertiary mt-1.5">
          Running locally via LM Studio
        </p>
      </div>
    </div>
  )
}

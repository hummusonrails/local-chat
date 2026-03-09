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

  useEffect(() => {
    if (autoScroll && (isStreaming || conv?.messages.length)) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [streamingContent, isStreaming, conv?.messages.length, autoScroll])

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    setAutoScroll(isAtBottom)
  }, [])

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
      console.log('[SEND] Starting streamChat, model=' + activeModel + ' msgs=' + currentConv.messages.concat(userMsg).length)
      let chunkCount = 0
      for await (const chunk of streamChat(
        currentConv.messages.concat(userMsg),
        activeModel,
        settings,
        authToken!,
        controller.signal,
      )) {
        chunkCount++
        fullContent += chunk
        appendStreamContent(chunk)
        if (chunkCount <= 3) {
          console.log('[SEND] chunk #' + chunkCount + ': "' + chunk.substring(0, 50) + '" total=' + fullContent.length)
        }
        if (settings.hapticFeedback && fullContent.length % 20 === 0) {
          haptic('light')
        }
      }
      console.log('[SEND] Stream done. chunks=' + chunkCount + ' fullContent.length=' + fullContent.length + ' text="' + fullContent.substring(0, 100) + '"')
      updateLastAssistantMessage(convId, fullContent)
    } catch (err: unknown) {
      console.log('[SEND] Error caught:', err)
      if (err instanceof Error && err.name === 'AbortError') {
        const current = useAppStore.getState().streamingContent
        if (current) updateLastAssistantMessage(convId, current)
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        updateLastAssistantMessage(convId, `Error: ${errorMsg}`)
      }
    } finally {
      console.log('[SEND] Finally block, setting streaming=false')
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
      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pt-6 pb-2"
      >
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-primary mb-2 tracking-tight">What can I help with?</h2>
            <p className="text-sm text-tertiary max-w-[300px] leading-relaxed">
              {connected
                ? `Connected to ${activeModel ? activeModel.split('/').pop() : 'local model'}`
                : 'Connect to LM Studio to start chatting'
              }
            </p>
          </div>
        )}

        <div className="max-w-[740px] mx-auto">
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

      {/* Scroll to bottom */}
      {!autoScroll && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-surface border border-border shadow-md flex items-center gap-1.5 hover:bg-hover z-10 animate-fade-in"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span className="text-xs text-secondary font-medium">New messages</span>
        </button>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="px-4 pb-2">
          <div className="max-w-[740px] mx-auto flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <div key={i} className="relative shrink-0 group">
                <img src={img} alt="" className="w-16 h-16 rounded-xl object-cover border border-border" />
                <button
                  onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-background text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="px-3 pb-[env(safe-area-inset-bottom,8px)] pt-2">
        <div className="max-w-[740px] mx-auto">
          <div className="flex items-end gap-1.5 bg-surface border border-border rounded-2xl px-3 py-2 focus-within:border-border-strong focus-within:shadow-sm transition-all">
            {/* Attachment */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-hover"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-tertiary">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
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
              placeholder="Message Local Chat..."
              rows={1}
              className="flex-1 bg-transparent text-[15px] text-primary placeholder:text-tertiary resize-none focus:outline-none max-h-[150px] py-1.5 leading-relaxed"
            />

            {/* Voice / Send */}
            {input.trim() || images.length > 0 ? (
              <button
                onClick={handleSend}
                disabled={isStreaming || !connected}
                className="shrink-0 w-9 h-9 rounded-xl bg-accent hover:bg-accent-hover flex items-center justify-center disabled:opacity-30 animate-scale-in"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M7 11L12 6L17 11M12 18V7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </button>
            ) : isStreaming ? (
              <button
                onClick={() => useAppStore.getState().stopStreaming()}
                className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 border border-border flex items-center justify-center animate-scale-in"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                onClick={toggleVoice}
                className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl ${isRecording ? 'bg-red-500' : 'hover:bg-hover'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isRecording ? 'white' : 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={isRecording ? '' : 'text-tertiary'}>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-center text-[10px] text-tertiary/60 mt-2 font-medium tracking-wide">
            Powered by LM Studio &middot; Running locally
          </p>
        </div>
      </div>
    </div>
  )
}

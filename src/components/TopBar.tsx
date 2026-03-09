'use client'

import { useAppStore } from '@/lib/store'
import { haptic, cn } from '@/lib/utils'

export default function TopBar() {
  const {
    setSidebarOpen, setModelPickerOpen, createConversation,
    activeModel, connected, activeConversation,
  } = useAppStore()

  const conv = activeConversation()

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background/80 backdrop-blur-xl pt-[env(safe-area-inset-top,8px)]">
      {/* Hamburger */}
      <button
        onClick={() => { setSidebarOpen(true); haptic('light') }}
        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-hover transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-secondary">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Model picker */}
      <button
        onClick={() => { setModelPickerOpen(true); haptic('light') }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-hover transition-colors max-w-[200px]"
      >
        <div className={cn('w-2 h-2 rounded-full', connected ? 'bg-green-500' : 'bg-red-500')} />
        <span className="text-sm font-semibold text-primary truncate">
          {activeModel || 'Select Model'}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-tertiary shrink-0">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* New chat */}
      <button
        onClick={() => { createConversation(); haptic('medium') }}
        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-hover transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </button>
    </div>
  )
}

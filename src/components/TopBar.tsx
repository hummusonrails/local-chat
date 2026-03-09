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
    <div className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-background/90 backdrop-blur-2xl pt-[env(safe-area-inset-top,6px)]">
      {/* Sidebar toggle */}
      <button
        onClick={() => { setSidebarOpen(true); haptic('light') }}
        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-hover active:bg-active"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="text-secondary">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      </button>

      {/* Model picker */}
      <button
        onClick={() => { setModelPickerOpen(true); haptic('light') }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-hover active:bg-active max-w-[220px]"
      >
        <div className={cn(
          'w-2 h-2 rounded-full ring-2',
          connected
            ? 'bg-emerald-500 ring-emerald-500/20'
            : 'bg-red-500 ring-red-500/20'
        )} />
        <span className="text-sm font-medium text-primary truncate">
          {activeModel ? activeModel.split('/').pop()?.replace(/-/g, ' ') : 'Select Model'}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-tertiary shrink-0">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* New chat */}
      <button
        onClick={() => { createConversation(); haptic('medium') }}
        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-hover active:bg-active"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}

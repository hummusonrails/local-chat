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
    <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background/80 backdrop-blur-2xl pt-[env(safe-area-inset-top,8px)]">
      {/* Sidebar toggle */}
      <button
        onClick={() => { setSidebarOpen(true); haptic('light') }}
        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-hover active:bg-active"
        aria-label="Toggle sidebar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-secondary">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      </button>

      {/* Model picker */}
      <button
        onClick={() => { setModelPickerOpen(true); haptic('light') }}
        className="flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-hover active:bg-active max-w-[260px] group"
      >
        <div className={cn(
          'w-2.5 h-2.5 rounded-full ring-[1.5px]',
          connected
            ? 'bg-emerald-400 ring-emerald-400/20'
            : 'bg-red-400 ring-red-400/20'
        )} />
        <span className="text-sm font-medium text-primary truncate">
          {activeModel ? activeModel.split('/').pop()?.replace(/-/g, ' ') : 'Select model'}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-tertiary shrink-0 transition-transform group-hover:translate-y-0.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* New chat */}
      <button
        onClick={() => { createConversation(); haptic('medium') }}
        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-hover active:bg-active group"
        aria-label="New conversation"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-secondary group-hover:text-accent transition-colors">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}

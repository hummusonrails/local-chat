'use client'

import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { groupConversations } from '@/lib/utils'
import { haptic, cn } from '@/lib/utils'

export default function Sidebar() {
  const {
    conversations, activeConversationId, sidebarOpen,
    setSidebarOpen, setActiveConversation, createConversation,
    deleteConversation, renameConversation, archiveConversation, pinConversation,
    setSettingsOpen, settings,
  } = useAppStore()

  const [search, setSearch] = useState('')
  const [contextMenu, setContextMenu] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const touchStartX = useRef(0)

  const filtered = search
    ? conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    : conversations

  const groups = groupConversations(filtered)

  const handleNew = () => {
    haptic('medium')
    createConversation()
    setSidebarOpen(false)
  }

  const handleSelect = (id: string) => {
    haptic('light')
    setActiveConversation(id)
  }

  const startRename = (id: string, currentTitle: string) => {
    setRenaming(id)
    setRenameValue(currentTitle)
    setContextMenu(null)
  }

  const submitRename = () => {
    if (renaming && renameValue.trim()) {
      renameConversation(renaming, renameValue.trim())
    }
    setRenaming(null)
  }

  const handleSwipeLeft = useCallback((id: string) => {
    haptic('light')
    deleteConversation(id)
  }, [deleteConversation])

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 w-[300px] max-w-[80vw] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col',
          'bg-sidebar border-r border-border',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-[env(safe-area-inset-top,16px)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-accent">
                <path d="M6 20V10C6 6.686 8.686 4 12 4C15.314 4 18 6.686 18 10V20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                <circle cx="12" cy="12.5" r="1.5" fill="currentColor" opacity="0.7"/>
              </svg>
            </div>
            <h1 className="text-sm font-semibold text-primary tracking-tight">Sanctum</h1>
          </div>
          <button
            onClick={handleNew}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-hover"
            title="New conversation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-accent/30 focus:shadow-[0_0_0_3px_var(--accent-glow)]"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {groups.map(group => (
            <div key={group.label}>
              <p className="px-3 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-widest text-tertiary">
                {group.label}
              </p>
              {group.conversations.map(conv => (
                <div
                  key={conv.id}
                  className="relative group"
                  onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
                  onTouchEnd={e => {
                    const diff = e.changedTouches[0].clientX - touchStartX.current
                    if (diff < -80) handleSwipeLeft(conv.id)
                  }}
                >
                  {renaming === conv.id ? (
                    <div className="px-2 py-1">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={submitRename}
                        onKeyDown={e => e.key === 'Enter' && submitRename()}
                        className="w-full bg-surface border border-accent/30 rounded-xl px-3 py-2.5 text-sm text-primary focus:outline-none focus:shadow-[0_0_0_3px_var(--accent-glow)]"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelect(conv.id)}
                      onContextMenu={e => {
                        e.preventDefault()
                        setContextMenu(contextMenu === conv.id ? null : conv.id)
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-xl text-[13px] truncate transition-colors',
                        conv.id === activeConversationId
                          ? 'bg-accent/10 text-primary font-medium border-l-2 border-accent'
                          : 'text-secondary hover:bg-hover hover:text-primary'
                      )}
                    >
                      {conv.pinned && <span className="mr-1.5 text-accent text-[11px]">&#x1f4cc;</span>}
                      {conv.title}
                    </button>
                  )}

                  {/* Context menu */}
                  {contextMenu === conv.id && (
                    <div className="absolute right-2 top-10 z-50 bg-surface border border-border rounded-xl shadow-lg py-1.5 min-w-[170px] animate-scale-in">
                      <button onClick={() => startRename(conv.id, conv.title)} className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-hover rounded-lg mx-0.5" style={{width: 'calc(100% - 4px)'}}>Rename</button>
                      <button onClick={() => { pinConversation(conv.id); setContextMenu(null) }} className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-hover rounded-lg mx-0.5" style={{width: 'calc(100% - 4px)'}}>
                        {conv.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button onClick={() => { archiveConversation(conv.id); setContextMenu(null) }} className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-hover rounded-lg mx-0.5" style={{width: 'calc(100% - 4px)'}}>Archive</button>
                      <div className="border-t border-border my-1.5" />
                      <button onClick={() => { deleteConversation(conv.id); setContextMenu(null) }} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg mx-0.5" style={{width: 'calc(100% - 4px)'}}>Delete</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          {groups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-tertiary text-sm">No conversations yet</p>
              <p className="text-tertiary/50 text-xs mt-1">Start one above</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-3 pb-[env(safe-area-inset-bottom,12px)]">
          <button
            onClick={() => { setSettingsOpen(true); setSidebarOpen(false) }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-hover group"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-tertiary group-hover:text-secondary transition-colors">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span className="text-sm text-secondary group-hover:text-primary transition-colors">Settings</span>
          </button>
        </div>
      </aside>
    </>
  )
}

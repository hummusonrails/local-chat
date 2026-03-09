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
          className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 w-[300px] max-w-[80vw] transition-transform duration-300 ease-in-out flex flex-col',
          'bg-sidebar',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-[env(safe-area-inset-top,12px)]">
          <h1 className="text-base font-semibold text-primary">Local Chat</h1>
          <button
            onClick={handleNew}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-hover transition-colors"
            title="New chat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-input border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {groups.map(group => (
            <div key={group.label}>
              <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
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
                    <div className="px-3 py-2">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={submitRename}
                        onKeyDown={e => e.key === 'Enter' && submitRename()}
                        className="w-full bg-input border border-accent rounded px-2 py-1 text-sm text-primary focus:outline-none"
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
                        'w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-colors',
                        conv.id === activeConversationId
                          ? 'bg-active text-primary'
                          : 'text-secondary hover:bg-hover'
                      )}
                    >
                      {conv.pinned && <span className="mr-1">📌</span>}
                      {conv.title}
                    </button>
                  )}

                  {/* Context menu */}
                  {contextMenu === conv.id && (
                    <div className="absolute right-2 top-10 z-50 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                      <button onClick={() => startRename(conv.id, conv.title)} className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-hover">Rename</button>
                      <button onClick={() => { pinConversation(conv.id); setContextMenu(null) }} className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-hover">
                        {conv.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button onClick={() => { archiveConversation(conv.id); setContextMenu(null) }} className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-hover">Archive</button>
                      <hr className="border-border my-1" />
                      <button onClick={() => { deleteConversation(conv.id); setContextMenu(null) }} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-hover">Delete</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          {groups.length === 0 && (
            <p className="text-center text-tertiary text-sm mt-8">No conversations yet</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-3 pb-[env(safe-area-inset-bottom,12px)]">
          <button
            onClick={() => { setSettingsOpen(true); setSidebarOpen(false) }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-hover transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            <span className="text-sm text-secondary">Settings</span>
          </button>
        </div>
      </aside>
    </>
  )
}

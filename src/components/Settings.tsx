'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { ACCENT_COLORS } from '@/lib/constants'
import { checkConnection } from '@/lib/lmstudio'
import { cn, haptic } from '@/lib/utils'

export default function Settings() {
  const { settings, settingsOpen, setSettingsOpen, updateSettings, connected, setConnected, clearAllConversations, conversations, authToken, logout } = useAppStore()
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionResult, setConnectionResult] = useState<boolean | null>(null)

  if (!settingsOpen) return null

  const handleTestConnection = async () => {
    if (!authToken) return
    setTestingConnection(true)
    setConnectionResult(null)
    const ok = await checkConnection(authToken)
    setConnectionResult(ok)
    setConnected(ok)
    setTestingConnection(false)
  }

  const handleLogout = () => {
    logout()
    setSettingsOpen(false)
  }

  const handleClearAll = () => {
    if (confirm('Delete all conversations? This cannot be undone.')) {
      clearAllConversations()
      haptic('heavy')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border pt-[env(safe-area-inset-top,12px)]">
        <button onClick={() => setSettingsOpen(false)} className="text-accent text-sm font-medium hover:text-accent-hover">Done</button>
        <h2 className="text-sm font-semibold text-primary tracking-tight">Settings</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom,16px)]">
        {/* Connection */}
        <section className="px-4 pt-6">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-tertiary mb-2.5 px-1">Connection</h3>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  'w-2 h-2 rounded-full ring-2',
                  connected
                    ? 'bg-emerald-500 ring-emerald-500/20'
                    : 'bg-red-500 ring-red-500/20'
                )} />
                <span className="text-sm text-primary font-medium">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-3 py-1.5 text-xs font-medium bg-accent hover:bg-accent-hover text-white rounded-lg disabled:opacity-40"
              >
                {testingConnection ? 'Testing...' : 'Test'}
              </button>
            </div>
            {connectionResult !== null && (
              <div className={cn('px-4 py-2.5 text-xs border-t border-border', connectionResult ? 'text-emerald-500' : 'text-red-400')}>
                {connectionResult ? 'Connection successful' : 'Connection failed — ensure LM Studio is running'}
              </div>
            )}
          </div>
        </section>

        {/* Appearance */}
        <section className="px-4 pt-6">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-tertiary mb-2.5 px-1">Appearance</h3>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3.5">
              <label className="text-sm text-primary font-medium mb-2.5 block">Theme</label>
              <div className="flex gap-1.5 bg-input rounded-lg p-1">
                {(['light', 'dark', 'system'] as const).map(theme => (
                  <button
                    key={theme}
                    onClick={() => updateSettings({ theme })}
                    className={cn(
                      'flex-1 py-2 rounded-md text-xs font-medium capitalize',
                      settings.theme === theme
                        ? 'bg-accent text-white shadow-sm'
                        : 'text-secondary hover:text-primary'
                    )}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-3.5 border-t border-border">
              <label className="text-sm text-primary font-medium mb-2.5 block">Accent</label>
              <div className="flex gap-3">
                {ACCENT_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => {
                      updateSettings({ accentColor: color.value })
                      haptic('light')
                    }}
                    className={cn(
                      'w-7 h-7 rounded-full transition-all',
                      settings.accentColor === color.value && 'ring-2 ring-offset-2 ring-offset-surface scale-110'
                    )}
                    style={{ backgroundColor: color.value, '--tw-ring-color': color.value } as React.CSSProperties}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Personalization */}
        <section className="px-4 pt-6">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-tertiary mb-2.5 px-1">Personalization</h3>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3.5">
              <label className="text-sm text-primary font-medium mb-0.5 block">About you</label>
              <p className="text-[11px] text-tertiary mb-2.5">What should the AI know about you?</p>
              <textarea
                value={settings.customContext}
                onChange={e => updateSettings({ customContext: e.target.value })}
                rows={3}
                maxLength={1500}
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-primary resize-none focus:outline-none focus:border-border-strong"
                placeholder="e.g. I'm a software engineer who works with TypeScript..."
              />
              <p className="text-[10px] text-tertiary text-right mt-1 font-mono">{settings.customContext.length}/1500</p>
            </div>
            <div className="px-4 py-3.5 border-t border-border">
              <label className="text-sm text-primary font-medium mb-0.5 block">Response instructions</label>
              <p className="text-[11px] text-tertiary mb-2.5">How should the AI respond?</p>
              <textarea
                value={settings.customInstructions}
                onChange={e => updateSettings({ customInstructions: e.target.value })}
                rows={3}
                maxLength={1500}
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-primary resize-none focus:outline-none focus:border-border-strong"
                placeholder="e.g. Be concise. Use code examples when relevant..."
              />
              <p className="text-[10px] text-tertiary text-right mt-1 font-mono">{settings.customInstructions.length}/1500</p>
            </div>
          </div>
        </section>

        {/* Behavior */}
        <section className="px-4 pt-6">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-tertiary mb-2.5 px-1">Behavior</h3>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <ToggleRow
              label="Stream responses"
              description="Show responses as they generate"
              value={settings.streamResponses}
              onChange={v => updateSettings({ streamResponses: v })}
            />
            <ToggleRow
              label="Send on Enter"
              description="Enter to send, Shift+Enter for new line"
              value={settings.sendOnEnter}
              onChange={v => updateSettings({ sendOnEnter: v })}
              borderTop
            />
            <ToggleRow
              label="Haptic feedback"
              description="Vibration on actions"
              value={settings.hapticFeedback}
              onChange={v => updateSettings({ hapticFeedback: v })}
              borderTop
            />
          </div>
        </section>

        {/* Data */}
        <section className="px-4 pt-6 pb-8">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-tertiary mb-2.5 px-1">Account</h3>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 flex items-center justify-between">
              <span className="text-sm text-primary">Conversations</span>
              <span className="text-sm text-tertiary font-mono">{conversations.length}</span>
            </div>
            <div className="px-4 py-3.5 border-t border-border">
              <button onClick={handleClearAll} className="text-sm text-red-400 hover:text-red-300">
                Delete all conversations
              </button>
            </div>
            <div className="px-4 py-3.5 border-t border-border">
              <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300">
                Sign out
              </button>
            </div>
          </div>
          <p className="text-[11px] text-tertiary/50 mt-3 px-1 leading-relaxed">
            Conversations synced securely. AI runs on your local LM Studio.
          </p>
        </section>
      </div>
    </div>
  )
}

function ToggleRow({ label, description, value, onChange, borderTop }: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
  borderTop?: boolean
}) {
  return (
    <div className={cn('px-4 py-3.5 flex items-center justify-between', borderTop && 'border-t border-border')}>
      <div>
        <p className="text-sm text-primary font-medium">{label}</p>
        <p className="text-[11px] text-tertiary mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => { onChange(!value); haptic('light') }}
        className={cn(
          'relative w-11 h-[26px] rounded-full transition-colors',
          value ? 'bg-accent' : 'bg-border-strong'
        )}
      >
        <span className={cn(
          'absolute top-[3px] w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
          value ? 'translate-x-[22px]' : 'translate-x-[3px]'
        )} />
      </button>
    </div>
  )
}

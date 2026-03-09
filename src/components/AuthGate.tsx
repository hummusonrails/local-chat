'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { authenticated, setAuthToken } = useAppStore()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (authenticated) return <>{children}</>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      })

      if (res.ok) {
        const { token } = await res.json()
        setAuthToken(token)
      } else {
        setError('Incorrect password')
      }
    } catch {
      setError('Connection failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-[100dvh] flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-[320px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-primary">Local Chat</h1>
          <p className="text-sm text-tertiary mt-1">Enter password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            placeholder="Password"
            autoFocus
            autoComplete="current-password"
            className="w-full bg-input border border-border rounded-xl px-4 py-3 text-primary text-center text-lg tracking-widest placeholder:text-tertiary placeholder:tracking-normal focus:outline-none focus:border-accent transition-colors"
          />

          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-3 rounded-xl bg-accent text-white font-medium disabled:opacity-40 transition-opacity"
          >
            {loading ? 'Signing in...' : 'Continue'}
          </button>
        </form>

        <p className="text-center text-[11px] text-tertiary mt-6">
          All data stays private. Powered by your local LM Studio.
        </p>
      </div>
    </div>
  )
}

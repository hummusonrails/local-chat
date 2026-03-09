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
      <div className="w-full max-w-[340px]">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-primary tracking-tight">Local Chat</h1>
          <p className="text-sm text-tertiary mt-2">Enter your password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            placeholder="Password"
            autoFocus
            autoComplete="current-password"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-primary text-center text-base tracking-widest placeholder:text-tertiary placeholder:tracking-normal focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent/20"
          />

          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium disabled:opacity-30"
          >
            {loading ? 'Signing in...' : 'Continue'}
          </button>
        </form>

        <p className="text-center text-[11px] text-tertiary/60 mt-8 leading-relaxed">
          All data stays private.<br />Powered by your local LM Studio instance.
        </p>
      </div>
    </div>
  )
}

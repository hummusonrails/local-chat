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
    <div className="h-[100dvh] flex items-center justify-center bg-background px-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent/[0.04] blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[360px] relative z-10">
        <div className="flex flex-col items-center mb-12">
          {/* Sanctum arch icon */}
          <div className="w-16 h-16 rounded-2xl bg-accent/[0.08] border border-accent/15 flex items-center justify-center mb-6 animate-breathe">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-accent">
              <path d="M6 20V10C6 6.686 8.686 4 12 4C15.314 4 18 6.686 18 10V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 20V11C9 9.343 10.343 8 12 8C13.657 8 15 9.343 15 11V20" stroke="currentColor" strokeWidth="1" opacity="0.4" strokeLinecap="round"/>
              <circle cx="12" cy="12.5" r="1.5" fill="currentColor" opacity="0.8"/>
              <line x1="5" y1="20" x2="19" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-primary tracking-tight">Sanctum</h1>
          <p className="text-sm text-tertiary mt-3 tracking-wide">Enter your password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Password"
              autoFocus
              autoComplete="current-password"
              className="w-full bg-surface border border-border rounded-2xl px-5 py-4 text-primary text-center text-base placeholder:text-tertiary focus:outline-none focus:border-accent/30 focus:shadow-[0_0_0_3px_var(--accent-glow)]"
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-red-500/10 border border-red-500/15">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-red-400 shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-4 rounded-2xl bg-accent hover:bg-accent-hover text-white font-semibold text-[15px] disabled:opacity-30 shadow-[0_2px_12px_var(--accent-glow)]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Signing in...
              </span>
            ) : 'Enter Sanctum'}
          </button>
        </form>

        <p className="text-center text-[11px] text-tertiary/50 mt-10 leading-relaxed tracking-wide">
          Your private AI sanctuary<br/>Powered locally by LM Studio
        </p>
      </div>
    </div>
  )
}

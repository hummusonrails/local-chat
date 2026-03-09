'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { fetchModels, checkConnection } from '@/lib/lmstudio'
import AuthGate from '@/components/AuthGate'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import ChatView from '@/components/ChatView'
import ModelPicker from '@/components/ModelPicker'
import Settings from '@/components/Settings'

export default function Home() {
  const {
    init, setModels, setActiveModel, setConnected, settings, activeModel,
    setSidebarOpen, authToken, authenticated,
  } = useAppStore()

  const touchStartX = useRef(0)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    init()
  }, [init])

  // Apply theme
  useEffect(() => {
    const root = document.documentElement
    const theme = settings.theme
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
  }, [settings.theme])

  // Apply accent color
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', settings.accentColor)
  }, [settings.accentColor])

  // Connect to LM Studio via API proxy
  useEffect(() => {
    if (!authenticated || !authToken) return
    let cancelled = false

    async function connect() {
      try {
        const ok = await checkConnection(authToken!)
        if (cancelled) return
        setConnected(ok)

        if (ok) {
          const models = await fetchModels(authToken!)
          if (cancelled) return
          setModels(models)
          if (models.length > 0 && !activeModel) {
            setActiveModel(models[0].id)
          }
        }
      } catch {
        if (!cancelled) setConnected(false)
      }
    }

    connect()
    const interval = setInterval(connect, 30000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [authenticated, authToken, setConnected, setModels, setActiveModel, activeModel])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (touchStartX.current < 30 && diff > 60) {
      setSidebarOpen(true)
    }
  }

  return (
    <AuthGate>
      <div
        className="h-[100dvh] flex flex-col bg-background text-primary overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <TopBar />
        <div className="flex-1 relative overflow-hidden">
          <ChatView />
        </div>
        <Sidebar />
        <ModelPicker />
        <Settings />
      </div>
    </AuthGate>
  )
}

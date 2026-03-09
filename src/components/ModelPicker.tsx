'use client'

import { useAppStore } from '@/lib/store'
import { cn, haptic } from '@/lib/utils'

export default function ModelPicker() {
  const { models, activeModel, modelPickerOpen, setModelPickerOpen, setActiveModel, connected } = useAppStore()

  if (!modelPickerOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setModelPickerOpen(false)} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border rounded-t-2xl shadow-2xl animate-slide-up max-h-[60vh] overflow-y-auto pb-[env(safe-area-inset-bottom,16px)]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-4 pb-2">
          <h3 className="text-base font-semibold text-primary mb-1">Select Model</h3>
          {!connected && (
            <p className="text-xs text-red-400 mb-2">LM Studio not connected</p>
          )}
        </div>

        <div className="px-2 pb-4">
          {models.length === 0 ? (
            <p className="text-center text-tertiary text-sm py-8">
              {connected ? 'No models loaded' : 'Connect to LM Studio to see models'}
            </p>
          ) : (
            models.map(model => (
              <button
                key={model.id}
                onClick={() => {
                  haptic('light')
                  setActiveModel(model.id)
                  setModelPickerOpen(false)
                }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors',
                  model.id === activeModel ? 'bg-active' : 'hover:bg-hover'
                )}
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-primary">{model.id}</p>
                  <p className="text-xs text-tertiary">{model.owned_by}</p>
                </div>
                {model.id === activeModel && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}

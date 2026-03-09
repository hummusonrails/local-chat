'use client'

import { useAppStore } from '@/lib/store'
import { cn, haptic } from '@/lib/utils'

export default function ModelPicker() {
  const { models, activeModel, modelPickerOpen, setModelPickerOpen, setActiveModel, connected } = useAppStore()

  if (!modelPickerOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setModelPickerOpen(false)} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border rounded-t-2xl shadow-2xl animate-slide-up max-h-[60vh] overflow-y-auto pb-[env(safe-area-inset-bottom,16px)]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-1 rounded-full bg-border-strong" />
        </div>

        <div className="px-5 pb-3">
          <h3 className="text-base font-semibold text-primary tracking-tight">Models</h3>
          {!connected && (
            <p className="text-xs text-red-400 mt-1">LM Studio not connected</p>
          )}
        </div>

        <div className="px-3 pb-4">
          {models.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-tertiary text-sm">
                {connected ? 'No models loaded in LM Studio' : 'Connect to LM Studio to see models'}
              </p>
            </div>
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
                  'w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors',
                  model.id === activeModel ? 'bg-active' : 'hover:bg-hover'
                )}
              >
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{model.id}</p>
                  <p className="text-xs text-tertiary mt-0.5">{model.owned_by}</p>
                </div>
                {model.id === activeModel && (
                  <div className="shrink-0 ml-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}

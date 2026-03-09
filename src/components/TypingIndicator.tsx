'use client'

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 mb-4 animate-message-in">
      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm2-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z"/>
        </svg>
      </div>
      <div className="flex gap-1.5 px-3 py-3">
        <span className="w-2 h-2 rounded-full bg-tertiary animate-typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-tertiary animate-typing-dot" style={{ animationDelay: '200ms' }} />
        <span className="w-2 h-2 rounded-full bg-tertiary animate-typing-dot" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  )
}

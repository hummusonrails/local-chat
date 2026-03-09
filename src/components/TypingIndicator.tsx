'use client'

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 mb-6 animate-message-in">
      <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center shrink-0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-accent">
          <path d="M6 20V10C6 6.686 8.686 4 12 4C15.314 4 18 6.686 18 10V20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
          <circle cx="12" cy="12.5" r="1.5" fill="currentColor" opacity="0.7"/>
        </svg>
      </div>
      <div className="flex items-center gap-1.5 py-3 px-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-typing-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}

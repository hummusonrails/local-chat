'use client'

import { memo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Message } from '@/lib/types'
import { cn, formatTime } from '@/lib/utils'

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const language = className?.replace('language-', '') || ''

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-border bg-code">
      <div className="flex items-center justify-between px-4 py-2.5 bg-code-header border-b border-border">
        <span className="text-xs font-mono text-tertiary">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-tertiary hover:text-primary"
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Copied
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono">
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}

function MessageBubble({ message, isStreaming }: { message: Message; isStreaming?: boolean }) {
  const isUser = message.role === 'user'
  const [showTime, setShowTime] = useState(false)

  return (
    <div
      className={cn(
        'flex w-full mb-6 animate-message-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
      onClick={() => setShowTime(!showTime)}
    >
      <div className={cn('max-w-[85%] sm:max-w-[70%]')}>
        {/* Assistant header */}
        {!isUser && (
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
                <circle cx="12" cy="15" r="1.5" />
              </svg>
            </div>
            <span className="text-xs font-medium text-tertiary tracking-wide uppercase">Local AI</span>
          </div>
        )}

        {/* Images */}
        {message.images && message.images.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {message.images.map((img, i) => (
              <img key={i} src={img} alt="Uploaded" className="max-w-[200px] max-h-[200px] rounded-xl object-cover border border-border" />
            ))}
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            isUser
              ? 'bg-user-bubble border border-border rounded-2xl rounded-br-md px-4 py-3'
              : 'text-primary pl-0.5'
          )}
        >
          {isUser ? (
            <p className="text-[15px] leading-[1.6] whitespace-pre-wrap text-primary">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-[1.7]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code({ className, children, ...props }) {
                    const isInline = !className
                    if (isInline) {
                      return <code className="bg-code border border-border px-1.5 py-0.5 rounded-md text-[13px] font-mono" {...props}>{children}</code>
                    }
                    return <CodeBlock className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>
                  },
                  a({ href, children }) {
                    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover underline underline-offset-2 decoration-accent/30 hover:decoration-accent">{children}</a>
                  },
                  table({ children }) {
                    return <div className="overflow-x-auto my-4 rounded-xl border border-border"><table className="border-collapse w-full text-sm">{children}</table></div>
                  },
                  th({ children }) {
                    return <th className="border-b border-border px-4 py-2.5 text-left bg-surface font-semibold text-xs uppercase tracking-wide text-secondary">{children}</th>
                  },
                  td({ children }) {
                    return <td className="border-b border-border px-4 py-2.5 text-sm">{children}</td>
                  },
                }}
              />
              {isStreaming && (
                <span className="inline-block w-[2px] h-[18px] bg-accent animate-blink ml-0.5 align-text-bottom" />
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        {showTime && (
          <p className={cn('text-[10px] text-tertiary mt-1.5 font-mono', isUser ? 'text-right' : 'text-left')}>
            {formatTime(message.timestamp)}
          </p>
        )}
      </div>
    </div>
  )
}

export default memo(MessageBubble)

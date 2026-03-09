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
    <div className="relative my-3 rounded-xl overflow-hidden bg-code">
      <div className="flex items-center justify-between px-4 py-2 bg-code-header text-xs text-tertiary">
        <span>{language}</span>
        <button onClick={handleCopy} className="hover:text-primary transition-colors">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed">
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
        'flex w-full mb-4 animate-message-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
      onClick={() => setShowTime(!showTime)}
    >
      <div className={cn(
        'max-w-[85%] sm:max-w-[75%]',
        isUser ? 'order-1' : 'order-1'
      )}>
        {/* Assistant avatar */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm2-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z"/>
              </svg>
            </div>
            <span className="text-xs text-tertiary font-medium">Local AI</span>
          </div>
        )}

        {/* Images */}
        {message.images && message.images.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {message.images.map((img, i) => (
              <img key={i} src={img} alt="Uploaded" className="max-w-[200px] max-h-[200px] rounded-xl object-cover" />
            ))}
          </div>
        )}

        {/* Message content */}
        <div
          className={cn(
            isUser
              ? 'bg-user-bubble text-primary rounded-[20px] px-4 py-2.5'
              : 'text-primary'
          )}
        >
          {isUser ? (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code({ className, children, ...props }) {
                    const isInline = !className
                    if (isInline) {
                      return <code className="bg-code px-1.5 py-0.5 rounded text-[13px]" {...props}>{children}</code>
                    }
                    return <CodeBlock className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>
                  },
                  a({ href, children }) {
                    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{children}</a>
                  },
                  table({ children }) {
                    return <div className="overflow-x-auto my-3"><table className="border-collapse w-full text-sm">{children}</table></div>
                  },
                  th({ children }) {
                    return <th className="border border-border px-3 py-2 text-left bg-hover font-semibold">{children}</th>
                  },
                  td({ children }) {
                    return <td className="border border-border px-3 py-2">{children}</td>
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
          <p className={cn('text-[10px] text-tertiary mt-1', isUser ? 'text-right' : 'text-left')}>
            {formatTime(message.timestamp)}
          </p>
        )}
      </div>
    </div>
  )
}

export default memo(MessageBubble)

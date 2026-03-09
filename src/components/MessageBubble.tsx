'use client'

import { memo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Message, ToolCall } from '@/lib/types'
import { cn, formatTime } from '@/lib/utils'

const TOOL_LABELS: Record<string, { label: string; icon: string }> = {
  brave_web_search: { label: 'Web Search', icon: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3.6 9h16.8M3.6 15h16.8M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9Z' },
  brave_local_search: { label: 'Local Search', icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z M12 7a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z' },
  fetch: { label: 'Fetch URL', icon: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14L21 3' },
  read_file: { label: 'Read File', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
  search_repositories: { label: 'GitHub Search', icon: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4' },
}

function getToolInfo(name: string | undefined): { label: string; icon: string } {
  if (!name) return { label: 'Tool', icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z' }
  return TOOL_LABELS[name] || { label: name.replace(/_/g, ' '), icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z' }
}

function ToolCallCard({ call }: { call: ToolCall }) {
  const [expanded, setExpanded] = useState(false)
  const info = getToolInfo(call.tool)
  const query = call.arguments?.query as string || call.arguments?.url as string || call.arguments?.path as string || ''

  return (
    <div className="my-3 rounded-xl border border-border bg-surface/50 overflow-hidden backdrop-blur-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-hover transition-colors text-left"
      >
        <div className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
          call.status === 'calling' ? 'bg-amber-500/10 border border-amber-500/15' :
          call.status === 'success' ? 'bg-accent/10 border border-accent/15' :
          'bg-red-500/10 border border-red-500/15'
        )}>
          {call.status === 'calling' ? (
            <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={call.status === 'success' ? 'text-accent' : 'text-red-400'}>
              <path d={info.icon} />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-primary">{info.label}</span>
          {query && <span className="text-xs text-tertiary ml-2 truncate block mt-0.5">{query}</span>}
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={cn('text-tertiary transition-transform duration-200', expanded && 'rotate-180')}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {expanded && call.output && (
        <div className="px-4 pb-3 border-t border-border pt-3">
          <pre className="text-[11px] text-secondary font-mono whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto leading-relaxed">
            {call.output.length > 2000 ? call.output.substring(0, 2000) + '...' : call.output}
          </pre>
        </div>
      )}
    </div>
  )
}

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
        <span className="text-[11px] font-mono text-tertiary uppercase tracking-wide">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-tertiary hover:text-accent transition-colors"
        >
          {copied ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><polyline points="20 6 9 17 4 12" /></svg>
              Copied
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
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
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-accent">
                <path d="M6 20V10C6 6.686 8.686 4 12 4C15.314 4 18 6.686 18 10V20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                <circle cx="12" cy="12.5" r="1.5" fill="currentColor" opacity="0.7"/>
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-tertiary tracking-wider uppercase">Sanctum</span>
          </div>
        )}

        {/* Images */}
        {message.images && message.images.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {message.images.map((img, i) => (
              <img key={i} src={img} alt="Uploaded" className="max-w-[200px] max-h-[200px] rounded-xl object-cover border border-border shadow-md" />
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
            <p className="text-[15px] leading-[1.65] whitespace-pre-wrap text-primary">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-[1.75]">
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="not-prose">
                  {message.toolCalls.map((tc, idx) => (
                    <ToolCallCard key={`${tc.tool}-${idx}`} call={tc} />
                  ))}
                </div>
              )}
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
                    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover underline underline-offset-2 decoration-accent/30 hover:decoration-accent transition-colors">{children}</a>
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
                  blockquote({ children }) {
                    return <blockquote className="border-l-2 border-accent/40 pl-4 italic text-secondary">{children}</blockquote>
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-[2px] h-[18px] bg-accent animate-blink ml-0.5 align-text-bottom" />
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        {showTime && (
          <p className={cn('text-[10px] text-tertiary mt-2 font-mono tracking-wide', isUser ? 'text-right' : 'text-left')}>
            {formatTime(message.timestamp)}
          </p>
        )}
      </div>
    </div>
  )
}

export default memo(MessageBubble)

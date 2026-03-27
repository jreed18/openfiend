import { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext'
import LeftRail from './LeftRail';
import AuditTrail from './AuditTrail';
import ToolDock from './ToolDock';
import BobStatus from './BobStatus';

function Chat() {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<string[]>([])
  const [isWaiting, setIsWaiting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, conversationId, send, switchConversation } = useWebSocket();
  const isFirstMount = useRef(true);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && 'type' in lastMsg && lastMsg.type === 'agent_response') {
      setIsWaiting(false);
    }
  }, [messages]);

  useEffect(() => {
    if (isFirstMount.current) {
      localStorage.removeItem('conversation-id');
      isFirstMount.current = false;
      return;
    }
    switchConversation(conversationId);
  }, [conversationId, switchConversation]);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim()) return;
    const chatHistory = [...chatMessages, message.trim()];
    send(message.trim(), conversationId);
    setChatMessages(chatHistory);
    setIsWaiting(true);
    setMessage('');
  };

  return (
    <>
      <style>{`
        .openfiend-scroll::-webkit-scrollbar { width: 6px; }
        .openfiend-scroll::-webkit-scrollbar-track { background: transparent; }
        .openfiend-scroll::-webkit-scrollbar-thumb {
          background: var(--purple);
          border-radius: 3px;
        }
        .openfiend-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--amber);
        }
        .openfiend-scroll {
          scrollbar-color: var(--purple) transparent;
          scrollbar-width: thin;
        }

        @keyframes thinking-pulse {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
        .thinking-dot:nth-child(1) { animation: thinking-pulse 1.4s 0s infinite; }
        .thinking-dot:nth-child(2) { animation: thinking-pulse 1.4s 0.2s infinite; }
        .thinking-dot:nth-child(3) { animation: thinking-pulse 1.4s 0.4s infinite; }
      `}</style>

      {/* Desktop surface */}
      <div
        className="grid h-screen w-screen gap-3 p-3 overflow-hidden"
        style={{
          backgroundColor: 'var(--bg)',
          gridTemplateColumns: '200px 1fr 260px',
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* ─── Left Rail Window ─── */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
          }}
        >
          <LeftRail />
        </div>

        {/* ─── Chat Window ─── */}
        <div
          className="relative flex flex-col overflow-hidden"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
          }}
        >
          {/* Title bar */}
          <div
            className="flex items-center px-4 shrink-0"
            style={{
              backgroundColor: 'var(--surface2)',
              borderBottom: '1px solid var(--border)',
              height: '36px',
            }}
          >
            {/* Dot controls */}
            <div className="flex items-center gap-1.5 mr-3">
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--purple)', opacity: 0.5 }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--purple)', opacity: 0.5 }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--purple)', opacity: 0.5 }} />
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                fontFamily: 'system-ui',
              }}
            >
              Chat with Bob
            </span>
            {/* Status badge */}
            <span
              className="ml-auto text-[9px] uppercase tracking-widest px-2 py-0.5"
              style={{
                color: isWaiting ? 'var(--amber)' : 'var(--green)',
                backgroundColor: isWaiting ? 'var(--amber-dim)' : 'rgba(107,201,138,0.12)',
                borderRadius: '4px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {isWaiting ? 'Thinking' : 'Ready'}
            </span>
          </div>

          {/* Message area */}
          <div className="openfiend-scroll flex-1 overflow-y-auto px-6 py-6 relative">
            {messages.length === 0 ? (
              /* Empty-state hero */
              <div className={`${chatMessages.length > 0 ? 'hidden' : ''} flex h-full flex-col items-center justify-center`}>
                <h1
                  className="mb-2 text-4xl font-extrabold uppercase tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Talk to{' '}
                  <span style={{ color: 'var(--purple)' }}>the fiend.</span>
                </h1>
                <p
                  className="mt-2 max-w-md text-sm leading-relaxed text-center"
                  style={{
                    color: 'var(--text-secondary)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Every action visible. Every permission explicit.
                  <br />
                  No black boxes.
                </p>
                <div
                  className="mt-6 text-[10px] uppercase tracking-widest"
                  style={{
                    color: 'var(--text-muted)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  [SYSTEM READY] [AWAITING INPUT]
                </div>
              </div>
            ) : (
              /* Messages list */
              <div className="mx-auto max-w-2xl space-y-4">
                {messages
                  .filter((msg): msg is Extract<typeof msg, { content: string }> => 'content' in msg)
                  .map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${msg.type === 'user_input' ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Bob label */}
                    {msg.type !== 'user_input' && (
                      <span
                        className="shrink-0 text-[9px] font-bold uppercase tracking-widest mt-1"
                        style={{
                          color: 'var(--amber)',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        BOB
                      </span>
                    )}
                    <div
                      className="max-w-lg px-4 py-3"
                      style={{
                        backgroundColor: msg.type === 'user_input' ? 'var(--purple-dim)' : 'var(--amber-dim)',
                        color: 'var(--text-primary)',
                        borderLeft: msg.type === 'user_input' ? '2px solid var(--purple-border)' : '2px solid var(--amber-border)',
                        borderRadius: '6px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '13px',
                        lineHeight: '1.65',
                      }}
                    >
                      {msg.content}
                    </div>
                    {/* You label */}
                    {msg.type === 'user_input' && (
                      <span
                        className="shrink-0 text-[9px] font-bold uppercase tracking-widest mt-1"
                        style={{
                          color: 'var(--purple)',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        YOU
                      </span>
                    )}
                  </div>
                ))}
                {/* Thinking indicator */}
                {isWaiting && (
                  <div className="flex items-start gap-3">
                    <span
                      className="shrink-0 text-[9px] font-bold uppercase tracking-widest mt-1"
                      style={{
                        color: 'var(--amber)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      BOB
                    </span>
                    <div
                      className="flex gap-1.5 px-4 py-3"
                      style={{
                        backgroundColor: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                      }}
                    >
                      <span className="thinking-dot h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--amber)' }} />
                      <span className="thinking-dot h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--amber)' }} />
                      <span className="thinking-dot h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--amber)' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Status bar */}
          <div
            className="flex items-center gap-2 px-4 shrink-0"
            style={{
              height: '24px',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--surface2)',
            }}
          >
            <span
              className="text-[9px] tracking-widest"
              style={{
                color: 'var(--text-muted)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {messages.filter(m => 'content' in m).length} msgs
            </span>
            <span style={{ color: 'var(--border-mid)' }}>&middot;</span>
            <span
              className="text-[9px] tracking-widest"
              style={{
                color: 'var(--text-muted)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              claude-sonnet-4
            </span>
            <span style={{ color: 'var(--border-mid)' }}>&middot;</span>
            <span
              className="text-[9px] tracking-widest"
              style={{
                color: isWaiting ? 'var(--amber)' : 'var(--green)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {isWaiting ? 'awaiting response' : 'idle'}
            </span>
          </div>

          {/* Input bar */}
          <div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <form onSubmit={handleSubmit}>
              <div
                className="flex items-center gap-3 px-3 py-2"
                style={{
                  backgroundColor: 'var(--surface2)',
                  border: '1px solid var(--border-mid)',
                  borderRadius: '6px',
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="say something to bob..."
                  aria-label="Message input"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--text-primary)',
                  }}
                  disabled={isWaiting}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isWaiting}
                  aria-label="Send message"
                  className="shrink-0 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                  style={{
                    backgroundColor: 'var(--purple)',
                    color: 'var(--bg)',
                    borderRadius: '4px',
                    border: 'none',
                    fontFamily: "'JetBrains Mono', monospace",
                    opacity: isWaiting || !message.trim() ? 0.4 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isWaiting && message.trim()) {
                      e.currentTarget.style.backgroundColor = 'var(--amber)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isWaiting && message.trim()) {
                      e.currentTarget.style.backgroundColor = 'var(--purple)';
                    }
                  }}
                >
                  {isWaiting ? '...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ─── Right Column: Audit Trail + Bob Status ─── */}
        <div className="flex flex-col gap-3 overflow-hidden">
          {/* Audit Trail Window */}
          <div
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
            }}
          >
            <AuditTrail />
          </div>

          {/* Bob Status Window */}
          <div
            className="flex flex-col shrink-0 overflow-hidden"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
            }}
          >
            <BobStatus />
          </div>
        </div>

        {/* ─── Permission Modal (floats over desktop) ─── */}
        <ToolDock />
      </div>
    </>
  );
}

export default Chat;

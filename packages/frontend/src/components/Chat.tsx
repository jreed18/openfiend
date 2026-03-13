import { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext'
import LeftRail from './LeftRail';
import AuditTrail from './AuditTrail';

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`;

function Chat() {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<string[]>([])
  const [isWaiting, setIsWaiting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, conversationId, send } = useWebSocket();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // When an agent_response arrives, stop waiting
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && 'type' in lastMsg && lastMsg.type === 'agent_response') {
      setIsWaiting(false);
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim()) return;

    // send only current message (backend tracks full history via conversationId)
    const chatHistory = [...chatMessages, message.trim()];
    send(message.trim(), conversationId);
    setChatMessages(chatHistory);
    setIsWaiting(true);

    // clear input field
    setMessage('');
  };

  return (
    <>
      {/* Google Font — Syne + Space Mono */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Mono&display=swap');

        /* Themed scrollbars */
        .openfiend-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .openfiend-scroll::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        .openfiend-scroll::-webkit-scrollbar-thumb {
          background: #e11d7e;
          border-radius: 4px;
        }
        .openfiend-scroll::-webkit-scrollbar-thumb:hover {
          background: #f97316;
        }

        /* Firefox */
        .openfiend-scroll {
          scrollbar-color: #e11d7e #0a0a0a;
          scrollbar-width: thin;
        }

        /* Thinking pulse */
        @keyframes thinking-pulse {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
        .thinking-dot:nth-child(1) { animation: thinking-pulse 1.4s 0s infinite; }
        .thinking-dot:nth-child(2) { animation: thinking-pulse 1.4s 0.2s infinite; }
        .thinking-dot:nth-child(3) { animation: thinking-pulse 1.4s 0.4s infinite; }
      `}</style>

      <div
        className="relative grid h-screen w-screen overflow-hidden"
        style={{
          backgroundColor: '#0a0a0a',
          backgroundImage: GRAIN_SVG,
          fontFamily: "'Syne', sans-serif",
          gridTemplateColumns: '260px 1fr 300px',
        }}
      >
        {/* Magenta accent strip — far left edge */}
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 z-20 h-full w-1"
          style={{ backgroundColor: '#e11d7e' }}
        />

        {/* ─── Left Rail ─── */}
        <LeftRail />

        {/* ─── Center Panel — Streaming Chat ─── */}
        <main className="relative flex flex-col overflow-hidden">
          {/* Message area */}
          <div className="openfiend-scroll flex-1 overflow-y-auto px-8 py-8">
            {messages.length === 0 ? (
              /* Empty-state hero */
              <div className={`${chatMessages.length > 0 ? 'hidden' : ''} flex h-full flex-col items-start justify-center`}>
                <h1
                  className="mb-2 text-5xl font-extrabold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl"
                >
                  Talk to
                  <br />
                  <span style={{ color: '#e11d7e' }}>the fiend.</span>
                </h1>
                <p
                  className="mt-2 max-w-md text-sm leading-relaxed"
                  style={{
                    color: '#737373',
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  Every action visible. Every permission explicit.
                  <br />
                  No black boxes.
                </p>
              </div>
            ) : (
              /* Messages list */
              <div className="mx-auto max-w-2xl space-y-5">
                {messages
                  .filter((msg): msg is Extract<typeof msg, { content: string }> => 'content' in msg)
                  .map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-end gap-3 ${msg.type === 'user_input' ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Bob avatar */}
                    {msg.type !== 'user_input' && (
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #333',
                          color: '#f97316',
                          fontFamily: "'Space Mono', monospace",
                        }}
                      >
                        B
                      </div>
                    )}
                    <div
                      className="max-w-lg rounded-lg px-4 py-3"
                      style={{
                        backgroundColor: msg.type === 'user_input' ? '#e11d7e' : '#1a1a1a',
                        color: msg.type === 'user_input' ? '#fff' : '#d4d4d4',
                        border: msg.type === 'user_input' ? 'none' : '1px solid #262626',
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '13px',
                        lineHeight: '1.6',
                      }}
                    >
                      {msg.content}
                    </div>
                    {/* You avatar */}
                    {msg.type === 'user_input' && (
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: '#e11d7e',
                          color: '#0a0a0a',
                          fontFamily: "'Space Mono', monospace",
                        }}
                      >
                        U
                      </div>
                    )}
                  </div>
                ))}
                {/* Thinking indicator */}
                {isWaiting && (
                  <div className="flex items-end gap-3">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase"
                      style={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        color: '#f97316',
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      B
                    </div>
                    <div
                      className="flex gap-1.5 rounded-lg px-4 py-3"
                      style={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #262626',
                      }}
                    >
                      <span className="thinking-dot h-2 w-2 rounded-full" style={{ backgroundColor: '#f97316' }} />
                      <span className="thinking-dot h-2 w-2 rounded-full" style={{ backgroundColor: '#f97316' }} />
                      <span className="thinking-dot h-2 w-2 rounded-full" style={{ backgroundColor: '#f97316' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input bar — pinned to bottom */}
          <div className="border-t border-neutral-800 px-8 py-5">
            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
              <div
                className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors focus-within:border-neutral-600"
                style={{
                  backgroundColor: '#111111',
                  borderColor: '#262626',
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="say something to bob..."
                  aria-label="Message input"
                  className="flex-1 bg-transparent text-sm text-white placeholder-neutral-600 outline-none"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                  disabled={isWaiting}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isWaiting}
                  aria-label="Send message"
                  className="shrink-0 rounded px-5 py-2 text-xs font-bold uppercase tracking-widest text-black transition-all duration-150 hover:brightness-90 active:scale-95 disabled:opacity-20"
                  style={{
                    backgroundColor: '#f97316',
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  {isWaiting ? '...' : 'Send'}
                </button>
              </div>
            </form>

            {/* Footer hints */}
            <div className="mx-auto mt-3 flex max-w-2xl justify-between">
              <p
                className="text-[10px]"
                style={{
                  color: '#404040',
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                security-first agent platform
              </p>
              <p
                className="text-[10px]"
                style={{
                  color: '#404040',
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                esc to clear
              </p>
            </div>
          </div>
        </main>

        {/* ─── Right Panel — Audit Trail ─── */}
        <AuditTrail />
      </div>
    </>
  );
}

export default Chat;

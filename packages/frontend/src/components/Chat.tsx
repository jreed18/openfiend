import { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext'
import LeftRail from './LeftRail';
import AuditTrail from './AuditTrail';
import ToolDock from './ToolDock';

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`;

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
    // When an agent_response arrives, stop waiting
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
          border-radius: 0px;
          box-shadow: 0 0 8px rgba(225, 29, 126, 0.6);
        }
        .openfiend-scroll::-webkit-scrollbar-thumb:hover {
          background: #f97316;
          box-shadow: 0 0 12px rgba(249, 115, 22, 0.8);
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

        /* Neon glow */
        @keyframes neon-glow {
          0%, 100% { text-shadow: 0 0 10px #e11d7e, 0 0 20px #e11d7e80; }
          50% { text-shadow: 0 0 15px #e11d7e, 0 0 30px #e11d7e; }
        }
        .neon-text {
          animation: neon-glow 3s infinite;
        }

        /* Message glow */
        @keyframes bob-glow {
          0%, 100% { box-shadow: -3px 3px 0 #e11d7e, 0 0 12px rgba(225, 29, 126, 0.3); }
          50% { box-shadow: -3px 3px 0 #e11d7e, 0 0 20px rgba(225, 29, 126, 0.5); }
        }
        .msg-bob { animation: bob-glow 4s infinite; }

        @keyframes user-glow {
          0%, 100% { box-shadow: -3px 3px 0 #f97316, 0 0 12px rgba(249, 115, 22, 0.3); }
          50% { box-shadow: -3px 3px 0 #f97316, 0 0 20px rgba(249, 115, 22, 0.5); }
        }
        .msg-user { animation: user-glow 4s infinite; }
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
        {/* Gradient overlay (subtle magenta glow on edges) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(180deg, rgba(225, 29, 126, 0.03) 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '150px',
            background: 'linear-gradient(180deg, transparent 0%, rgba(249, 115, 22, 0.02) 100%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
        {/* Magenta accent strip — far left edge with glow */}
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 z-20 h-full"
          style={{
            backgroundColor: '#e11d7e',
            width: '3px',
            boxShadow: '0 0 15px rgba(225, 29, 126, 0.6), inset 0 0 10px rgba(225, 29, 126, 0.3)',
          }}
        />

        {/* Vertical dividers with glow */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '260px',
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: '#262626',
            boxShadow: '0 0 8px rgba(225, 29, 126, 0.2)',
            zIndex: 10,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '300px',
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: '#262626',
            boxShadow: '0 0 8px rgba(249, 115, 22, 0.2)',
            zIndex: 10,
          }}
        />

        {/* ─── Left Rail ─── */}
        <LeftRail />

        {/* ─── Center Panel — Streaming Chat ─── */}
        <main className="relative flex flex-col overflow-hidden">
          {/* Tool call dock */}
          <ToolDock />
          
          {/* Structural top accent */}
          <div style={{ borderBottom: '2px solid #e11d7e', height: '1px' }} />

          {/* Message area */}
          <div className="openfiend-scroll flex-1 overflow-y-auto px-8 py-8 relative">
            {/* Structural grid overlay (subtle) */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `linear-gradient(0deg, transparent 24%, #262626 25%, #262626 26%, transparent 27%, transparent 74%, #262626 75%, #262626 76%, transparent 77%, transparent),
                                 linear-gradient(90deg, transparent 24%, #262626 25%, #262626 26%, transparent 27%, transparent 74%, #262626 75%, #262626 76%, transparent 77%, transparent)`,
                backgroundSize: '100px 100px',
                opacity: 0.02,
                pointerEvents: 'none',
              }}
            />
            {messages.length === 0 ? (
              /* Empty-state hero */
              <div className={`${chatMessages.length > 0 ? 'hidden' : ''} flex h-full flex-col items-start justify-center relative`}>
                {/* + corner accent */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '40px',
                    fontSize: '48px',
                    color: '#f97316',
                    opacity: 0.3,
                    fontWeight: 'bold',
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  +
                </div>

                <h1
                  className="mb-2 text-5xl font-extrabold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl neon-text"
                  style={{
                    transform: 'skewY(-2deg)',
                  }}
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

                {/* Decorative specs */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: '60px',
                    right: '80px',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: '#e11d7e',
                    opacity: 0.4,
                    boxShadow: '0 0 8px #e11d7e',
                  }}
                />
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    bottom: '120px',
                    right: '60px',
                    width: '3px',
                    height: '3px',
                    borderRadius: '50%',
                    backgroundColor: '#f97316',
                    opacity: 0.3,
                    boxShadow: '0 0 6px #f97316',
                  }}
                />
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    bottom: '200px',
                    left: '80px',
                    width: '2px',
                    height: '2px',
                    borderRadius: '50%',
                    backgroundColor: '#e11d7e',
                    opacity: 0.3,
                    boxShadow: '0 0 4px #e11d7e',
                  }}
                />

                {/* System status */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '0',
                    fontSize: '10px',
                    color: '#404040',
                    fontFamily: "'Space Mono', monospace",
                    letterSpacing: '0.1em',
                  }}
                >
                  [SYSTEM READY] [AWAITING INPUT]
                </div>
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
                        className="flex h-8 w-8 shrink-0 items-center justify-center text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: '#1a1a1a',
                          border: '2px solid #e11d7e',
                          color: '#e11d7e',
                          fontFamily: "'Space Mono', monospace",
                        }}
                      >
                        B
                      </div>
                    )}
                    <div
                      className={`max-w-lg px-4 py-3 ${msg.type === 'user_input' ? 'msg-user' : 'msg-bob'}`}
                      style={{
                        backgroundColor: msg.type === 'user_input' ? '#e11d7e' : '#1a1a1a',
                        color: msg.type === 'user_input' ? '#fff' : '#d4d4d4',
                        border: msg.type === 'user_input' ? '2px solid #f97316' : '2px solid #e11d7e',
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
                        className="flex h-8 w-8 shrink-0 items-center justify-center text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: '#e11d7e',
                          border: '2px solid #f97316',
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
                      className="flex h-8 w-8 shrink-0 items-center justify-center text-[10px] font-bold uppercase"
                      style={{
                        backgroundColor: '#1a1a1a',
                        border: '2px solid #e11d7e',
                        color: '#e11d7e',
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      B
                    </div>
                    <div
                      className="msg-bob flex gap-1.5 px-4 py-3"
                      style={{
                        backgroundColor: '#1a1a1a',
                        border: '2px solid #262626',
                      }}
                    >
                      <span className="thinking-dot h-2 w-2" style={{ backgroundColor: '#f97316', boxShadow: '0 0 4px #f97316' }} />
                      <span className="thinking-dot h-2 w-2" style={{ backgroundColor: '#f97316', boxShadow: '0 0 4px #f97316' }} />
                      <span className="thinking-dot h-2 w-2" style={{ backgroundColor: '#f97316', boxShadow: '0 0 4px #f97316' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input bar — pinned to bottom */}
          <div style={{ borderTop: '2px solid #262626', position: 'relative' }} className="px-8 py-5">
            {/* + accent */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '20px',
                color: '#f97316',
                opacity: 0.4,
                fontWeight: 'bold',
              }}
            >
              +
            </div>

            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
              <div
                className="flex items-center gap-3 border px-4 py-3 transition-colors relative"
                style={{
                  backgroundColor: '#111111',
                  borderColor: '#333',
                  borderWidth: '2px',
                  boxShadow: 'inset 0 0 8px rgba(249, 115, 22, 0.1), 0 0 0 rgba(249, 115, 22, 0)',
                  transition: 'box-shadow 0.3s ease',
                }}
                onFocus={() => {}}
                onBlur={() => {}}
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
                  className="shrink-0 px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-150 active:scale-95"
                  style={{
                    backgroundColor: '#f97316',
                    color: '#000',
                    border: '2px solid #f97316',
                    fontFamily: "'Syne', sans-serif",
                    opacity: isWaiting || !message.trim() ? 0.5 : 1,
                    boxShadow: '0 0 0 rgba(249, 115, 22, 0)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isWaiting && message.trim()) {
                      e.currentTarget.style.backgroundColor = '#e11d7e';
                      e.currentTarget.style.borderColor = '#e11d7e';
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.boxShadow = '0 0 15px rgba(225, 29, 126, 0.6)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isWaiting && message.trim()) {
                      e.currentTarget.style.backgroundColor = '#f97316';
                      e.currentTarget.style.borderColor = '#f97316';
                      e.currentTarget.style.color = '#000';
                      e.currentTarget.style.boxShadow = '0 0 0 rgba(249, 115, 22, 0)';
                    }
                  }}
                >
                  {isWaiting ? '...' : 'Send'}
                </button>
              </div>
            </form>

            {/* Footer hints */}
            <div className="mx-auto mt-3 flex max-w-2xl justify-between relative">
              <div
                style={{
                  position: 'absolute',
                  top: '-8px',
                  left: 0,
                  right: 0,
                  height: '1px',
                  borderTop: '1px dashed #262626',
                }}
              />
              <p
                className="text-[10px]"
                style={{
                  color: '#404040',
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: '0.05em',
                }}
              >
                // SECURITY-FIRST AGENT
              </p>
              <p
                className="text-[10px]"
                style={{
                  color: '#404040',
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: '0.05em',
                }}
              >
                ESC TO CLEAR //
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

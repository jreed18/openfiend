import { v4 as uuidv4 } from 'uuid';
import { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext'
import LeftRail from './LeftRail';
import AuditTrail from './AuditTrail';

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`;

function Chat() {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<string[]>([])
  const [conversationId, setConversationId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, send } = useWebSocket();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    console.log('useEffect: checking localStorage...');
    const storedId = localStorage.getItem('conversation-id');
    const id = storedId || uuidv4();
    if (!storedId) {
      localStorage.setItem('conversation-id', id);
    }
    setConversationId(id);
  }, [])

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
              <div className="space-y-4">
                {messages
                  .filter((msg): msg is Extract<typeof msg, { content: string }> => 'content' in msg)
                  .map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-4 ${msg.type === 'user_input' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="max-w-md rounded px-4 py-3"
                      style={{
                        backgroundColor: msg.type === 'user_input' ? '#e11d7e' : '#1a1a1a',
                        color: msg.type === 'user_input' ? '#fff' : '#e5e5e5',
                        border: msg.type === 'user_input' ? 'none' : '1px solid #333',
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '14px',
                        lineHeight: '1.5',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input bar — pinned to bottom */}
          <div className="border-t border-neutral-800 px-8 py-5">
            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
              <div
                className="flex items-center border-b-2"
                style={{ borderColor: '#e11d7e' }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="say something..."
                  aria-label="Message input"
                  className="flex-1 bg-transparent py-3 text-base text-white placeholder-neutral-600 outline-none"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  aria-label="Send message"
                  className="shrink-0 px-5 py-3 text-xs font-bold uppercase tracking-widest text-black transition-colors duration-150 hover:brightness-90 active:brightness-75 disabled:opacity-20"
                  style={{
                    backgroundColor: '#f97316',
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  Send
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

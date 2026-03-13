import { useWebSocket } from "@frontend/context/WebSocketContext";

function LeftRail() {
  const { conversations, conversationId, switchConversation, startNewConversation } = useWebSocket();

  return (
    <aside className="flex h-full flex-col border-r border-neutral-800">
      {/* Brand header */}
      <div className="border-b border-neutral-800 px-4 py-5">
        <span
          className="text-xs uppercase tracking-widest"
          style={{
            color: '#e11d7e',
            fontFamily: "'Space Mono', monospace",
            letterSpacing: '0.3em',
          }}
        >
          openfiend v0.1
        </span>
      </div>

      {/* Conversation list */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p
          className="px-2 pb-2 text-[10px] uppercase tracking-widest"
          style={{
            color: '#525252',
            fontFamily: "'Space Mono', monospace",
          }}
        >
          Conversations
        </p>

        {/* Placeholder entries */}
        <ul className="space-y-1">
          {conversations.length < 1 ? 
          ['No conversations yet'].map((label, i) => (
            <li
              key={i}
              className="rounded px-3 py-2 text-xs"
              style={{
                color: '#525252',
                fontFamily: "'Space Mono', monospace",
              }}
            >
              {label}
            </li>
          ))
          : conversations.map(({ id, title }) => (
                <li
                  key={id}
                  onClick={() => switchConversation(id)}
                  className="cursor-pointer rounded px-3 py-2 text-xs transition-colors hover:bg-neutral-800/50"
                  style={{
                    color: id === conversationId ? '#e11d7e' : '#a3a3a3',
                    backgroundColor: id === conversationId ? '#1a1a1a' : 'transparent',
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  {title}
                </li>
            ))
        }
        </ul>
        
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-neutral-800 px-4 py-4">
        <button
          onClick={startNewConversation}
          className="w-full rounded px-3 py-2 text-left text-xs uppercase tracking-widest transition-colors hover:bg-neutral-800/50"
          style={{
            color: '#e11d7e',
            fontFamily: "'Space Mono', monospace",
          }}
        >
          + New Chat with Bob
        </button>
      </div>
    </aside>
  );
}

export default LeftRail;

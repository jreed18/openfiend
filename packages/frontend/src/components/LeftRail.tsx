import { useWebSocket } from "@frontend/context/WebSocketContext";

function LeftRail() {
  const { conversations, conversationId, switchConversation, startNewConversation } = useWebSocket();

  return (
    <aside className="flex h-full flex-col" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Title bar */}
      <div style={{ backgroundColor: 'var(--surface2)', borderBottom: '1px solid var(--border)', height: '36px', position: 'relative' }} className="flex items-center px-4">
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
            fontFamily: "system-ui",
          }}
        >
          OpenFiend
        </span>
        <span
          className="ml-2 text-[9px] uppercase tracking-widest"
          style={{
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          v0.1
        </span>
      </div>

      {/* Conversation list */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p
          className="px-2 pb-2 text-[10px] uppercase tracking-widest"
          style={{
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
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
                color: 'var(--text-muted)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {label}
            </li>
          ))
          : conversations.map(({ id, title }) => (
                <li
                  key={id}
                  onClick={() => {
                    console.log('Clicking conversation:', id);
                    switchConversation(id);
                  }}
                  className="cursor-pointer px-3 py-2 text-xs transition-all border-l-2"
                  style={{
                    color: id === conversationId ? 'var(--purple)' : 'var(--text-secondary)',
                    backgroundColor: id === conversationId ? 'var(--purple-dim)' : 'transparent',
                    borderLeftColor: id === conversationId ? 'var(--purple)' : 'transparent',
                    borderRadius: '4px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  onMouseEnter={(e) => {
                    if (id !== conversationId) {
                      e.currentTarget.style.backgroundColor = 'var(--surface2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (id !== conversationId) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {title}
                </li>
            ))
        }
        </ul>
        
      </nav>

      {/* Bottom actions */}
      <div style={{ borderTop: '1px solid var(--border)' }} className="px-4 py-4">
        <button
          onClick={startNewConversation}
          className="w-full px-3 py-2 text-left text-xs uppercase tracking-widest transition-all"
          style={{
            color: 'var(--purple)',
            fontFamily: "'JetBrains Mono', monospace",
            border: '1px solid var(--purple-border)',
            borderRadius: '4px',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--purple-dim)';
            e.currentTarget.style.color = 'var(--purple)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--purple)';
          }}
        >
          + New Chat with Bob
        </button>
      </div>
    </aside>
  );
}

export default LeftRail;

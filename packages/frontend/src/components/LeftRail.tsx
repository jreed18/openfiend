import { useWebSocket } from "@frontend/context/WebSocketContext";

function LeftRail() {
  const { conversations, conversationId, switchConversation, startNewConversation } = useWebSocket();

  return (
    <aside className="flex h-full flex-col" style={{ borderRight: '2px solid #262626' }}>
      {/* Brand header */}
      <div style={{ borderBottom: '2px solid #262626', position: 'relative' }} className="px-4 py-5">
        {/* + accent */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '4px',
            right: '8px',
            fontSize: '16px',
            color: '#e11d7e',
            opacity: 0.3,
            fontWeight: 'bold',
          }}
        >
          +
        </div>

        <div
          className="text-lg font-bold uppercase"
          style={{
            color: '#e11d7e',
            fontFamily: "'Syne', sans-serif",
            letterSpacing: '0.05em',
            textShadow: '0 0 10px rgba(225, 29, 126, 0.4)',
          }}
        >
          OpenFiend
        </div>
        <div
          className="text-[10px] uppercase tracking-widest mt-1"
          style={{
            color: '#525252',
            fontFamily: "'Space Mono', monospace",
          }}
        >
          v0.1
        </div>
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
                  onClick={() => {
                    console.log('Clicking conversation:', id);
                    switchConversation(id);
                  }}
                  className="cursor-pointer px-3 py-2 text-xs transition-all border-l-2"
                  style={{
                    color: id === conversationId ? '#e11d7e' : '#a3a3a3',
                    backgroundColor: id === conversationId ? '#1a1a1a' : 'transparent',
                    borderLeftColor: id === conversationId ? '#e11d7e' : 'transparent',
                    fontFamily: "'Space Mono', monospace",
                  }}
                  onMouseEnter={(e) => {
                    if (id !== conversationId) {
                      e.currentTarget.style.backgroundColor = '#1a1a1a';
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
      <div style={{ borderTop: '2px solid #262626' }} className="px-4 py-4">
        <button
          onClick={startNewConversation}
          className="w-full px-3 py-2 text-left text-xs uppercase tracking-widest transition-all"
          style={{
            color: '#e11d7e',
            fontFamily: "'Space Mono', monospace",
            border: '2px solid #e11d7e',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e11d7e';
            e.currentTarget.style.color = '#0a0a0a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#e11d7e';
          }}
        >
          + New Chat with Bob
        </button>
      </div>
    </aside>
  );
}

export default LeftRail;

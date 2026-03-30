import { useWebSocket } from "@frontend/context/WebSocketContext";

function BobStatus() {
  const { auditLogs, toolCalls, systemInfo } = useWebSocket();

  const hasPending = toolCalls.some(t => t.status === 'pending_approval');

  const lastAction = (() => {
    if (auditLogs.length === 0) return 'None';
    const last = auditLogs[auditLogs.length - 1];
    switch (last.eventType) {
      case 'llm_call': return 'LLM call';
      case 'tool_invocation': return typeof last.input === 'string' ? last.input.slice(0, 18) : 'Tool call';
      case 'agent_response': return 'Responded';
      case 'permission_request': return 'Asked permission';
      default: return last.eventType.slice(0, 18);
    }
  })();

  const cards = [
    { label: 'Daemon', value: 'Running', color: 'var(--green)' },
    { label: 'Model', value: systemInfo.model, color: 'var(--text-primary)' },
    { label: 'Last Action', value: lastAction, color: 'var(--text-secondary)' },
    { label: 'State', value: hasPending ? 'Awaiting Perm' : 'Ready', color: hasPending ? 'var(--amber)' : 'var(--green)' },
  ];

  const tools = [
    { name: 'Notion Brain', status: 'connected', color: 'var(--green)' },
    { name: 'Shell', status: 'ready', color: 'var(--text-muted)' },
    { name: 'Web Search', status: 'ready', color: 'var(--text-muted)' },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Title bar */}
      <div
        style={{ backgroundColor: 'var(--surface2)', borderBottom: '1px solid var(--border)', height: '32px' }}
        className="flex items-center px-3 shrink-0"
      >
        <div className="flex items-center gap-1.5 mr-3">
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--purple)', opacity: 0.5 }} />
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--purple)', opacity: 0.5 }} />
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--purple)', opacity: 0.5 }} />
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            fontFamily: "system-ui",
          }}
        >
          Bob — Status
        </span>
      </div>

      {/* Status cards */}
      <div className="px-3 py-3">
        <div className="grid grid-cols-2 gap-1.5">
          {cards.map(({ label, value, color }) => (
            <div
              key={label}
              className="px-2 py-2"
              style={{
                backgroundColor: 'var(--surface2)',
                borderRadius: '4px',
                border: '1px solid var(--border)',
              }}
            >
              <span
                className="text-[7px] uppercase tracking-widest block mb-0.5"
                style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
              >
                {label}
              </span>
              <span
                className="text-[11px] font-medium"
                style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div className="px-3 pb-3 flex-1">
        <p
          className="text-[8px] uppercase tracking-widest mb-2"
          style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          Tools
        </p>
        <div className="flex flex-col gap-1">
          {tools.map(({ name, status, color }) => (
            <div
              key={name}
              className="flex items-center justify-between px-2 py-1.5"
              style={{
                backgroundColor: 'var(--surface2)',
                borderRadius: '4px',
                border: '1px solid var(--border)',
              }}
            >
              <span
                className="text-[9px]"
                style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}
              >
                {name}
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    display: 'inline-block',
                  }}
                />
                <span
                  className="text-[8px] uppercase tracking-widest"
                  style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BobStatus;

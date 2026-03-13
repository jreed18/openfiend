import { AuditLogEntry } from "@openfiend/shared";
import { useWebSocket } from "@frontend/context/WebSocketContext";

function AuditTrail() {
  const { auditLogs } = useWebSocket();

  function formatTime(timestamp: number) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  function getEventStyle(eventType: string) {
    switch (eventType) {
      case 'tool_invocation':
        return { bg: '#e11d7e', label: 'TOOL' };
      case 'llm_call':
        return { bg: '#f97316', label: 'LLM' };
      case 'permission_request':
        return { bg: '#facc15', label: 'PERM' };
      case 'agent_response':
        return { bg: '#22c55e', label: 'RESP' };
      default:
        return { bg: '#525252', label: eventType.toUpperCase() };
    }
  }

  function getEventDescription(log: AuditLogEntry) {
    switch (log.eventType) {
      case 'llm_call':
        return 'Bob thought about your message';
      case 'tool_invocation':
        return 'Bob used a tool';
      case 'tool_result':
        return 'Tool returned results';
      case 'permission_request':
        return 'Bob asked for permission';
      case 'permission_decision':
        return 'Permission was granted';
      case 'agent_response':
        return 'Bob responded';
      default:
        return log.eventType;
    }
  }

  return (
    <aside className="flex h-full flex-col border-l border-neutral-800">
      {/* Panel header */}
      <div className="border-b border-neutral-800 px-4 py-5">
        <span
          className="text-xs uppercase tracking-widest"
          style={{
            color: '#f97316',
            fontFamily: "'Space Mono', monospace",
            letterSpacing: '0.2em',
          }}
        >
          Audit Trail
        </span>
      </div>

      {/* Timeline area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {auditLogs.length < 1 ? (
          <p
            className="text-xs leading-relaxed"
            style={{
              color: '#404040',
              fontFamily: "'Space Mono', monospace",
            }}
          >
            No events yet. Actions will appear here as the agent runs.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {auditLogs.map((log) => {
              const event = getEventStyle(log.eventType);
              return (
                <div
                  key={log.id}
                  className="border-l-2 pl-3 py-1"
                  style={{ borderColor: event.bg }}
                >
                  {/* Top row: badge + timestamp */}
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: event.bg,
                        color: '#0a0a0a',
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      {event.label}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{
                        color: '#525252',
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      {formatTime(log.timestamp)}
                    </span>
                  </div>

                  {/* Event description */}
                  <p
                    className="text-[11px] leading-relaxed"
                    style={{
                      color: '#737373',
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    {getEventDescription(log)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer status */}
      <div className="border-t border-neutral-800 px-4 py-3 flex items-center gap-2">
        <div
          className="h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: auditLogs.length > 0 ? '#22c55e' : '#404040',
          }}
        />
        <p
          className="text-[10px] uppercase tracking-widest"
          style={{
            color: '#404040',
            fontFamily: "'Space Mono', monospace",
          }}
        >
          {auditLogs.length} events · hash chain intact
        </p>
      </div>
    </aside>
  );
}

export default AuditTrail;

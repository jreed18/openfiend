import { Fragment } from "react";
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
        const toolInput = typeof log.input === 'string' ? log.input : '';
        return toolInput ?
          `Bob used a tool: "${toolInput.slice(0,50)}"`
        : 'Bob used a tool';
      case 'tool_result':
        return 'Tool returned results';
      case 'permission_request':
        return 'Bob asked for permission';
      case 'permission_decision':
        return 'Permission was granted';
      case 'agent_response':
        const responsePreview = typeof log.output === 'string' ? log.output : '';
        return responsePreview ?
          `Bob said: "${responsePreview.slice(0,40)}"`
        : 'Bob responded';
      default:
        return log.eventType;
    }
  }

  return (
    <aside className="flex h-full flex-col" style={{ borderLeft: '2px solid #262626' }}>
      {/* Panel header */}
      <div style={{ borderBottom: '2px solid #262626', position: 'relative' }} className="px-4 py-5">
        {/* + accent */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '8px',
            fontSize: '16px',
            color: '#f97316',
            opacity: 0.3,
            fontWeight: 'bold',
          }}
        >
          +
        </div>

        <div
          className="text-lg font-bold uppercase"
          style={{
            color: '#f97316',
            fontFamily: "'Syne', sans-serif",
            letterSpacing: '0.05em',
            textShadow: '0 0 10px rgba(249, 115, 22, 0.4)',
          }}
        >
          Audit Trail
        </div>
        <div
          className="text-[10px] uppercase tracking-widest mt-1"
          style={{
            color: '#404040',
            fontFamily: "'Space Mono', monospace",
          }}
        >
          // all events logged
        </div>
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
            &gt; no events recorded.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {auditLogs.map((log, idx) => {
              const prev = auditLogs[idx - 1];
              const showDivider = prev && (log.timestamp - prev.timestamp > 5000)
              const event = getEventStyle(log.eventType);

              return (
                <Fragment key={log.id}>
                 {showDivider && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex-1 border-t border-neutral-800" />
                    <span style={{
                      color: '#525252',
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '9px',
                    }}>
                      new turn
                    </span>
                    <div className="flex-1 border-t border-neutral-800" />
                  </div>
                 )}
                 <div
                    className="py-1 pl-3"
                    style={{ borderLeft: '4px solid ' + event.bg }}
                  >
                  {/* Top row: badge + timestamp */}
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: event.bg,
                        color: '#0a0a0a',
                        fontFamily: "'Space Mono', monospace",
                        border: '1px solid ' + event.bg,
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
                </Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer status */}
      <div style={{ borderTop: '2px solid #262626' }} className="px-4 py-3 flex items-center gap-2">
        <div
          style={{
            width: '6px',
            height: '6px',
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
          {auditLogs.length} EVENTS / CHAIN OK
        </p>
      </div>
    </aside>
  );
}

export default AuditTrail;

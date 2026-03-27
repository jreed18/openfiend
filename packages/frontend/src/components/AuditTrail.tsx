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
        return { bg: 'var(--red)', label: 'EXEC' };
      case 'llm_call':
        return { bg: 'var(--amber)', label: 'READ' };
      case 'permission_request':
        return { bg: 'var(--purple)', label: 'PERM' };
      case 'agent_response':
        return { bg: 'var(--green)', label: 'OK' };
      case 'tool_result':
        return { bg: 'var(--blue)', label: 'WRITE' };
      case 'permission_decision':
        return { bg: 'var(--green)', label: 'OK' };
      default:
        return { bg: 'var(--text-muted)', label: 'NET' };
    }
  }

  function getEventDescription(log: AuditLogEntry) {
    switch (log.eventType) {
      case 'llm_call':
        return 'Bob thought about your message';
      case 'tool_invocation':
        const toolInput = typeof log.input === 'string' ? log.input : '';
        return toolInput
          ? `${toolInput.slice(0, 40)}`
          : 'Bob used a tool';
      case 'tool_result':
        return 'Tool returned results';
      case 'permission_request':
        return 'Permission requested';
      case 'permission_decision':
        return 'Permission was granted';
      case 'agent_response':
        const responsePreview = typeof log.output === 'string' ? log.output : '';
        return responsePreview
          ? `${responsePreview.slice(0, 35)}`
          : 'Bob responded';
      default:
        return log.eventType;
    }
  }

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
          Audit Trail
        </span>
        <span
          className="ml-auto text-[8px] tracking-widest"
          style={{
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {auditLogs.length} events
        </span>
      </div>

      {/* Timeline area */}
      <div className="openfiend-scroll flex-1 overflow-y-auto px-2 py-2">
        {auditLogs.length < 1 ? (
          <p
            className="text-[9px] leading-relaxed px-1"
            style={{
              color: 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            &gt; no events recorded.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {auditLogs.map((log, idx) => {
              const prev = auditLogs[idx - 1];
              const showDivider = prev && (log.timestamp - prev.timestamp > 5000);
              const event = getEventStyle(log.eventType);

              return (
                <Fragment key={log.id}>
                  {showDivider && (
                    <div className="py-0.5">
                      <div style={{ borderTop: '1px solid var(--border)' }} />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 py-0.5 px-1">
                    <span
                      className="text-[8px] shrink-0"
                      style={{
                        color: 'var(--text-muted)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {formatTime(log.timestamp)}
                    </span>
                    <span
                      className="px-1 text-[7px] font-bold uppercase tracking-wider shrink-0"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${event.bg} 20%, transparent)`,
                        color: event.bg,
                        fontFamily: "'JetBrains Mono', monospace",
                        borderRadius: '2px',
                      }}
                    >
                      {event.label}
                    </span>
                    <span
                      className="text-[9px] leading-tight truncate"
                      style={{
                        color: 'var(--text-secondary)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {getEventDescription(log)}
                    </span>
                  </div>
                </Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditTrail;

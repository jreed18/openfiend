function AuditTrail() {
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
        <p
          className="text-xs leading-relaxed"
          style={{
            color: '#404040',
            fontFamily: "'Space Mono', monospace",
          }}
        >
          No events yet. Actions will appear here as the agent runs.
        </p>
      </div>

      {/* Footer status */}
      <div className="border-t border-neutral-800 px-4 py-3">
        <p
          className="text-[10px] uppercase tracking-widest"
          style={{
            color: '#404040',
            fontFamily: "'Space Mono', monospace",
          }}
        >
          Hash chain intact
        </p>
      </div>
    </aside>
  );
}

export default AuditTrail;

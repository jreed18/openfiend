function LeftRail() {
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
          {['No conversations yet'].map((label, i) => (
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
          ))}
        </ul>
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-neutral-800 px-4 py-4">
        <button
          className="w-full rounded px-3 py-2 text-left text-xs uppercase tracking-widest transition-colors hover:bg-neutral-800/50"
          style={{
            color: '#737373',
            fontFamily: "'Space Mono', monospace",
          }}
        >
          Settings
        </button>
      </div>
    </aside>
  );
}

export default LeftRail;

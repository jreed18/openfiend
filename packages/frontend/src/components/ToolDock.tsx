import { useWebSocket } from '@frontend/context/WebSocketContext';

export default function ToolDock() {
    const { toolCalls, approveToolCall, rejectToolCall } = useWebSocket();

    // Only show the first pending tool call as a modal
    const pendingTool = toolCalls.find(t => t.status === 'pending_approval');

    if (!pendingTool) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
            <div
                className="w-96"
                style={{
                    backgroundColor: 'var(--surface2)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '8px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                    fontFamily: "'JetBrains Mono', monospace",
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: '1px solid var(--border-mid)' }}
                >
                    <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--red)', fontSize: '14px' }}>&#9672;</span>
                        <span
                            className="text-[11px] font-bold uppercase tracking-widest"
                            style={{ color: 'var(--red)' }}
                        >
                            Permission Required
                        </span>
                    </div>
                    <span
                        className="text-[9px] uppercase tracking-widest px-2 py-0.5"
                        style={{
                            color: 'var(--amber)',
                            backgroundColor: 'var(--amber-dim)',
                            borderRadius: '3px',
                        }}
                    >
                        Pending
                    </span>
                </div>

                {/* Action description in a code block */}
                <div className="px-4 py-3">
                    <div
                        className="px-3 py-2 text-[11px] leading-relaxed"
                        style={{
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                        }}
                    >
                        <span className="block text-[10px] font-bold mb-1" style={{ color: 'var(--amber)' }}>
                            {pendingTool.toolName}
                        </span>
                        {pendingTool.action || 'No details available'}
                    </div>

                    {/* Explanation */}
                    <p
                        className="mt-3 text-[10px] leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {pendingTool.reasoning || 'Bob wants to perform this action.'}
                    </p>

                    {/* Risk level */}
                    {pendingTool.riskLevel && (
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-[8px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                Risk:
                            </span>
                            <span
                                className="text-[9px] uppercase tracking-widest px-1.5 py-0.5"
                                style={{
                                    color: pendingTool.riskLevel === 'high' ? 'var(--red)'
                                        : pendingTool.riskLevel === 'medium' ? 'var(--amber)'
                                        : 'var(--green)',
                                    backgroundColor: pendingTool.riskLevel === 'high' ? 'rgba(224,92,106,0.15)'
                                        : pendingTool.riskLevel === 'medium' ? 'var(--amber-dim)'
                                        : 'rgba(107,201,138,0.12)',
                                    borderRadius: '3px',
                                }}
                            >
                                {pendingTool.riskLevel}
                            </span>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div
                    className="flex gap-2 px-4 py-3"
                    style={{ borderTop: '1px solid var(--border-mid)' }}
                >
                    <button
                        onClick={() => approveToolCall(pendingTool.id)}
                        className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                        style={{
                            backgroundColor: 'rgba(107, 201, 138, 0.15)',
                            border: '1px solid rgba(107, 201, 138, 0.4)',
                            borderRadius: '4px',
                            color: 'var(--green)',
                        }}
                    >
                        Allow this
                    </button>
                    <button
                        onClick={() => rejectToolCall(pendingTool.id)}
                        className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                        style={{
                            backgroundColor: 'rgba(224, 92, 106, 0.15)',
                            border: '1px solid rgba(224, 92, 106, 0.4)',
                            borderRadius: '4px',
                            color: 'var(--red)',
                        }}
                    >
                        Deny
                    </button>
                </div>
            </div>
        </div>
    );
}

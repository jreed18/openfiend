import { useState } from 'react';
import { useWebSocket } from '@frontend/context/WebSocketContext';
import { ToolCall } from '@openfiend/shared';

// floating window for expanded tool call detail
function ToolWindow({
    tool,
    onClose,
    onApprove,
    onReject
}: {
    tool: ToolCall;
    onClose: () => void;
    onApprove?: () => void;
    onReject?: () => void;
}) {
    return (
        <div
            className='absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-80'
            style={{
                background: 'linear-gradient(135deg, rgba(255,29,126,0.12), rgba(249,115,22,0.08))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,29,126,0.4)',
                boxShadow: '0 0 20px rgba(225,29,126,0.2), 0 8px 32px rgba(0,0,0,0.5)',
                fontFamily: "'Space Mono', monospace",
            }}
        >
            {/* Title Bar */}
            <div
                className='flex items-center justify-between px-3 py-2'
                style={{ borderBottom: '1px solid rgba(225,29,126,0.5)' }}
            >
                <span className='text-[10px] uppercase tracking-widst' style={{ color: '#e11d7e' }}>
                    {tool.toolName}
                </span>
                <button
                    onClick={onClose}
                    className='text-[10px] uppercase tracking-wider hover:opacity-100 transition-opacity'
                    style={{ color: '#737373', opacity: 0.5 }}
                    >
                        X
                    </button>
            </div>

            {/* Content */}
            <div className='p-3'>
                <p className='text-[11px] leading-relaxed' style={{ color: '#d4d4d4' }}>
                    {tool.action || 'No details available'}
                </p>
                <div
                    className='mt-2 text-[9px] uppercase tracking-widest'
                    style={{ color: '#737373' }}
                >
                    Status: <span style={{
                        color: tool.status === 'pending_approval' ? '#f97316'
                        : tool.status === 'approved' ? '#22c55e'
                        : tool.status === 'rejected' ? '#ef4444'
                        : '#e11d7e'
                    }}>{tool.status.replace('_', ' ')}</span>
                </div>

                <div className='mt-3 flex flex-col gap-2'>
                    <div
                        className='pl-2 text-[10px] leading-relaxed'
                        style={{ borderLeft: '2px solid rgba(249,115,22,0.5)' }}
                    >
                        <span className='text-[8px] uppercase tracking-widest block mb-0.5' style={{ color: '#737373' }}>
                            Reasoning
                        </span>
                        <span style={{ color: '#a3a3a3' }}>{tool.reasoning || 'N/A'}</span>
                    </div>

                    <div
                        className='pl-2 text-[10px] leading-relaxed'
                        style={{ borderLeft: '2px solid rgba(239,68,68,0.4)' }}
                    >
                        <span className='text-[8px] uppercase tracking-widest block mb-0.5' style={{ color: '#737373' }}>
                            Risk Level
                        </span>
                        <span style={{ color: '#a3a3a3' }}>{tool.riskLevel || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Action buttons (for pending tasks) */}
            {tool.status === 'pending_approval' && (
                <div
                    className='flex gap-2 px-3 py-2'
                    style={{ borderTop: '1px solid rgba(225,29,126,0.3)' }}
                >
                    <button
                        onClick={onApprove}
                        className='flex-1 py-1.5 text-[10px]font-bold uppercase tracking-widest transition-all active:scale-95'
                        style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.15)',
                            border: '1px solid rgba(34, 197, 94, 0.4)',
                            color: '#22c55e',
                        }}
                    >
                        Approve
                    </button>
                    <button
                        onClick={onReject}
                        className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                        style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#ef4444',
                        }}
                    >
                        Reject
                    </button>
                </div>
            )}
        </div>
    );
}

export default function ToolDock() {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // use WebSocket context to get current tool calls and approve/reject functions
    const { toolCalls, approveToolCall, rejectToolCall } = useWebSocket();
    
    // The ToolCall shape from context has: id, toolName, action, reasoning, riskLevel, status, conversationId
    // You'll need to map toolName → name and action → detail for ToolWindow,
    // or update ToolWindow to use the new shape directly.

    const statusIcon = (status: ToolCall['status']) => {
        switch (status) {
            case 'pending_approval': return '◈';
            case 'approved': return '◉';
            case 'rejected': return '⊘';
        }
    };

     const statusColor = (status: ToolCall['status']) => {
        switch (status) {
            case 'pending_approval': return '#f97316';
            case 'approved': return '#22c55e';
            case 'rejected': return '#ef4444';
        }
    };

    return (
        <div
            className='absolute bottom-35 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-3 py-2'
            style={{
                background: 'linear-gradient(135deg, rgba(225, 29, 126, 0.08), rgba(249, 115, 22, 0.05), rgba(225, 29, 126, 0.06))',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(225, 29, 126, 0.2)',
                boxShadow: '0 0 15px rgba(225, 29, 126, 0.1), 0 4px 20px rgba(0, 0, 0, 0.3)',
                borderRadius: '2px',
            }}
        >
            {/* Stained glass shimmer */}
            <div
                aria-hidden='true'
                className='absolute inset-0 pointer-events-none'
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(225,29,126,0.05), rgba(249,115,22,0.05), transparent)',
                    animation: 'shimmer 3s infinite',
                }}
            />

                  {toolCalls.map((tool) => (
                    <div key={tool.id} className="relative">
                    {expandedId === tool.id && (
                        <ToolWindow
                        tool={tool}
                        onClose={() => setExpandedId(null)}
                        onApprove={() => approveToolCall(tool.id)}
                        onReject={() => rejectToolCall(tool.id)}
                        />
                    )}
                    <button
                        onClick={() => setExpandedId(expandedId === tool.id ? null : tool.id)}
                        className="flex items-center gap-2 px-3 py-1.5 transition-all hover:brightness-125"
                        style={{
                        background: expandedId === tool.id
                            ? 'rgba(225, 29, 126, 0.15)'
                            : 'transparent',
                        fontFamily: "'Space Mono', monospace",
                        }}
                    >
                        <span style={{ color: statusColor(tool.status), fontSize: '12px' }}>
                        {statusIcon(tool.status)}
                        </span>
                        <span
                        className="text-[10px] uppercase tracking-wider"
                        style={{ color: '#d4d4d4' }}
                        >
                        {tool.toolName} - {tool.action}
                        </span>
                    </button>
                    </div>
                ))}
        </div>
    )
    
}
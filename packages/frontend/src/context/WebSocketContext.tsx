import { createContext, ReactNode, useContext, useState, useEffect, useCallback } from "react";
import { AuditLogEntry, Message, ToolCall } from '@openfiend/shared';
import { v4 as uuidv4 } from "uuid";

interface PermissionRequest {
  skill: string,
  permissions: string[],
}

interface WebSocketContextType {
  connectionStatus: "connecting" | "connected" | "disconnected" | "error",
  systemInfo: {
    model: string,
    provider: string,
  },
  messages: Message[],
  auditLogs: AuditLogEntry[],
  currentPermissionRequest: PermissionRequest | null,
  conversationId: string,
  conversations: Array<{id: string, title: string}>,
  startNewConversation: () => void,
  switchConversation: (id: string) => void,
  send: (content: string, conversationId: string) => void,
  toolCalls: ToolCall[],
  approveToolCall: (id: string) => void,
  rejectToolCall: (id: string) => void,
}

interface WebSocketProviderProps {
  children: ReactNode,
  url?: string,
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function useWebSocket(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

export function WebSocketProvider({ children, url = `ws://${window.location.host}/ws` }: WebSocketProviderProps) {
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");
  const [messages, setMessages] = useState<Message[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [systemInfo, setSystemInfo] = useState({ model: 'claude-haiku-4-5', provider: 'anthropic' });
  const [currentPermissionRequest, setCurrentPermissionRequest] = useState<PermissionRequest | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [conversations, setConversations] = useState<{ id: string, title: string }[]>([])
  const [conversationId, setConversationId] = useState(() => uuidv4());

  useEffect(() => {
    if (!url) return;

    setConnectionStatus("connecting");
    const socket = new WebSocket(url);

    socket.onopen = () => {
      setConnectionStatus("connected");
      setWs(socket);
    };

    socket.onmessage = (e) => {
      try {
        const parsedMessage = JSON.parse(e.data);

        // new conversation creation initiated by user_input
        if (parsedMessage.type === 'user_input') {
          setConversations(prev => {
            const conversationExists = prev.some(x => x.id === parsedMessage.conversationId);
            if (!conversationExists) {
              return [...prev, {
                id: parsedMessage.conversationId,
                title: parsedMessage.content.slice(0, 40) + (parsedMessage.content.length > 40 ? '...' : ''),
              }];
            }
            return prev;
          })
        }

        if (parsedMessage.type === 'agent_response' || parsedMessage.type === 'user_input') {
          setMessages((prev) => [...prev, parsedMessage]);
        } else if (parsedMessage.type === 'permission_request') {
          setCurrentPermissionRequest({
            skill: parsedMessage.skillName,
            permissions: parsedMessage.permissions,
          });

          // push to toolCalls array:
          setToolCalls(prev => [...prev, {
            id: parsedMessage.id,
            toolName: parsedMessage.toolName,
            action: parsedMessage.action,
            reasoning: parsedMessage.reasoning,
            riskLevel: parsedMessage.riskLevel,
            status: 'pending_approval',
            conversationId: parsedMessage.conversationId,
          }]);

        } else if (parsedMessage.type === 'error') {
          console.error('Server error:', parsedMessage.message);
        } else if (parsedMessage.type === 'audit_log') {
          setAuditLogs(prev => [...prev, parsedMessage.entry])
        } else if (parsedMessage.type === 'system_info') {
          setSystemInfo({
            model: parsedMessage.model,
            provider: parsedMessage.provider,
          });
        } else if (parsedMessage.type === 'decision_approved' || parsedMessage.type === 'decision_rejected') {
          const { decision } = parsedMessage;
          const newStatus = parsedMessage.type === 'decision_approved' ? 'approved' : 'rejected';

          // update the tool call status (same as clicking the allow / reject in UI)
          setToolCalls(prev => prev.map(x => x.id === decision.pageId ? { ...x, status: newStatus } : x ));

          // remove after delay so user sees the status change in the UI
          setTimeout(() => {
            setToolCalls(prev => prev.filter(x => x.id !== decision.pageId));
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    };

    socket.onerror = () => {
      setConnectionStatus('error');
    };

    socket.onclose = () => {
      setConnectionStatus('disconnected');
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [url]);

  const send = useCallback((content: string, conversationId: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message: Message = {
        type: 'user_input',
        content,
        conversationId,
      };
      ws.send(JSON.stringify(message));
    }
  }, [ws]);

  const startNewConversation = useCallback(() => {
    const newId = uuidv4();
    setConversationId(newId);
    setMessages([]);
    localStorage.setItem('conversation-id', newId);
  }, [])

  // cover approval scenario
  const approveToolCall = useCallback((id: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const tool = toolCalls.find(x => x.id === id);
      
      if (!tool) {
        console.error(`Tool call with id ${id} not found`);
        return;
      }
      
      ws.send(JSON.stringify({
        type: 'permission_response',
        id,
        decision: 'approved',
        conversationId: tool.conversationId,
      }));
      
      // update toolCalls with new approved info
      setToolCalls(prev => prev.map(x => x.id === id ? { ...x, status: 'approved' } : x ));

      // remove after a delay to allow user to see the approved status in the UI
      setTimeout(() => {
        setToolCalls(prev => prev.filter(x => x.id !== id));
      }, 2000);
    }
  }, [ws, toolCalls]);

  // cover rejection scenario
  const rejectToolCall = useCallback((id: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const tool = toolCalls.find(x => x.id === id);
      if (!tool) {
        console.error(`Tool call with id ${id} not found`);
        return;
      }

      ws.send(JSON.stringify({
        type: 'permission_response',
        id,
        decision: 'rejected',
        conversationId: tool.conversationId,
      }));

      setToolCalls(prev => prev.map(x => x.id === id ? { ...x, status: 'rejected'} : x ));

      // remove after a delay to allow user to see the rejected status in the UI
      setTimeout(() => {
        setToolCalls(prev => prev.filter(x => x.id !== id));
      }, 2000);
    }
  }, [ws, toolCalls]);

  const switchConversation = useCallback(async (id: string) => {
    setConversationId(id);
    setMessages([]);
    localStorage.setItem('conversation-id', id);

    const response = await fetch(`/api/conversations/${id}/messages`);
    const messages = await response.json();
    console.log('Fetched messages:', messages); // ADD THIS
    
    const formatted = messages.map((msg: { role: string; content: string; conversationId: string }) => ({
      type: msg.role === 'user' ? 'user_input' : 'agent_response',
      content: msg.content,
      conversationId: msg.conversationId,
    }));
    
    console.log('Formatted messages:', formatted); // ADD THIS
    setMessages(formatted);
  }, []);


  const value: WebSocketContextType = {
    connectionStatus,
    systemInfo,
    messages,
    auditLogs,
    currentPermissionRequest,
    conversationId,
    conversations,
    toolCalls,
    startNewConversation,
    switchConversation,
    approveToolCall,
    rejectToolCall,
    send,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

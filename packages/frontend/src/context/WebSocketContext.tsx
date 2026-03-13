import { createContext, ReactNode, useContext, useState, useEffect, useCallback } from "react";
import { AuditLogEntry, Message } from '@openfiend/shared';
import { v4 as uuidv4 } from "uuid";

interface PermissionRequest {
  skill: string,
  permissions: string[],
}

interface WebSocketContextType {
  connectionStatus: "connecting" | "connected" | "disconnected" | "error",
  messages: Message[],
  auditLogs: AuditLogEntry[],
  currentPermissionRequest: PermissionRequest | null,
  conversationId: string,
  conversations: Array<{id: string, title: string}>,
  startNewConversation: () => void,
  switchConversation: (id: string) => void,
  send: (content: string, conversationId: string) => void,
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
  const [currentPermissionRequest, setCurrentPermissionRequest] = useState<PermissionRequest | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [conversations, setConversations] = useState<{ id: string, title: string }[]>([])
  const [conversationId, setConversationId] = useState(() => {
    return localStorage.getItem('conversation-id') || uuidv4();
  });

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
        } else if (parsedMessage.type === 'error') {
          console.error('Server error:', parsedMessage.message);
        } else if (parsedMessage.type === 'audit_log') {
          setAuditLogs(prev => [...prev, parsedMessage.entry])
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

  const switchConversation = useCallback((id: string) => {
    setConversationId(id);
    setMessages([]);
    localStorage.setItem('conversation-id', id);
  }, []);

  const value: WebSocketContextType = {
    connectionStatus,
    messages,
    auditLogs,
    currentPermissionRequest,
    conversationId,
    conversations,
    startNewConversation,
    switchConversation,
    send,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

import { createContext, ReactNode, useContext, useState, useEffect, useCallback } from "react";
import { AuditLogEntry, Message } from '@openfiend/shared';

interface PermissionRequest {
  skill: string,
  permissions: string[],
}

interface WebSocketContextType {
  connectionStatus: "connecting" | "connected" | "disconnected" | "error",
  messages: Message[],
  auditLogs: AuditLogEntry[],
  currentPermissionRequest: PermissionRequest | null,
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

export function WebSocketProvider({ children, url = 'ws://localhost:3737/ws' }: WebSocketProviderProps) {
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");
  const [messages, setMessages] = useState<Message[]>([]);
  const [auditLogs] = useState<AuditLogEntry[]>([]);
  const [currentPermissionRequest, setCurrentPermissionRequest] = useState<PermissionRequest | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

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

        if (parsedMessage.type === 'agent_response' || parsedMessage.type === 'user_input') {
          setMessages((prev) => [...prev, parsedMessage]);
        } else if (parsedMessage.type === 'permission_request') {
          setCurrentPermissionRequest({
            skill: parsedMessage.skillName,
            permissions: parsedMessage.permissions,
          });
        } else if (parsedMessage.type === 'error') {
          console.error('Server error:', parsedMessage.message);
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


  const value: WebSocketContextType = {
    connectionStatus,
    messages,
    auditLogs,
    currentPermissionRequest,
    send,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

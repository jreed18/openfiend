import { z } from 'zod';

// Message types for WebSocket communication
export const MessageSchema = z.union([
  z.object({
    type: z.literal('user_input'),
    content: z.string(),
    conversationId: z.string(),
  }),
  z.object({
    type: z.literal('permission_request'),
    id: z.string(),
    toolName: z.string(),   // which tool Bob wants to use
    action: z.string(),     // what Bob intends to do (human-readable summary)
    reasoning: z.string(),  // why Bob thinks it's necessary
    riskLevel: z.enum(['low', 'medium', 'high']),
    conversationId: z.string()
  }),
  z.object({
    type: z.literal('permission_decision'),
    id: z.string(),   // matches permission_request id
    decision: z.enum(['approved', 'rejected']),
    conversationId: z.string()
  }),
  z.object({
    type: z.literal('agent_response'),
    content: z.string(),
    conversationId: z.string(),
  }),
  z.object({
    type: z.literal('audit_log'),
    entry: z.object({
      id: z.string(),
      timestamp: z.number(),
      eventType: z.string(),
      conversationId: z.string(),
      input: z.string(),
      output: z.string(),
    })
  })
]);

export type Message = z.infer<typeof MessageSchema>;

// Skill manifest
export const SkillManifestSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  author: z.string(),
  permissions: z.array(z.enum(['filesystem', 'network', 'shell', 'clipboard', 'notifications'])),
  main: z.string(),
});

export type SkillManifest = z.infer<typeof SkillManifestSchema>;

// Permission states
export const PermissionStateSchema = z.enum(['allowed', 'rejected', 'unknown']);
export type PermissionState = z.infer<typeof PermissionStateSchema>;

// Audit log entry
export const AuditLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  eventType: z.enum([
    'llm_call',
    'tool_invocation',
    'tool_result',
    'permission_request',
    'permission_decision',
    'agent_response',
  ]),
  conversationId: z.string(),
  skillName: z.string().optional(),
  input: z.any().optional(),
  output: z.any().optional(),
  approved: z.boolean().optional(),
  tokenCount: z.number().optional(),
});

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

// Conversation
export const ConversationSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  title: z.string(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      timestamp: z.number(),
    })
  ),
});

export type Conversation = z.infer<typeof ConversationSchema>;


export enum PermissionStatus {
    Approved = 'approved',
    Rejected = 'rejected',
}

export interface ToolCall {
  id: string;   // notion page id
  toolName: string;   // which tool Bob wants to use
  action: string;     // human-readable summary of what Bob wants to do
  reasoning: string;   // why Bob thinks this is necessary
  riskLevel: 'low' | 'medium' | 'high';   // assessment of the risk level
  status: 'pending_approval' | 'approved' | 'rejected';   // current status of the tool call
  conversationId: string;   // which conversation this tool call is associated with
}
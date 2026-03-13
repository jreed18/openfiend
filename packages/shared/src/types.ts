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
    skillName: z.string(),
    permissions: z.array(z.string()),
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
export const PermissionStateSchema = z.enum(['allowed', 'denied', 'unknown']);
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

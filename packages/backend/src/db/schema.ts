import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const conversations = sqliteTable('conversations', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
});

export const messages = sqliteTable('messages', {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id').notNull().references(() => conversations.id),
    role: text('role').notNull(),
    content: text('content').notNull(),
    timestamp: integer('timestamp').notNull(),
});

export const auditLogs = sqliteTable('audit_logs', {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id').notNull().references(() => conversations.id),
    eventType: text('event_type').notNull(),
    input: text('input'),
    output: text('output'),
    timestamp: integer('timestamp').notNull(),
});

export const notionConfig = sqliteTable('notion_config', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
})
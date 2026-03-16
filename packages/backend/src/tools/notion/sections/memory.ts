import { getNotionClient } from '../client';
import { db } from '@backend/db';
import { notionConfig } from '@backend/db/schema';
import { eq } from 'drizzle-orm';

/**
 * MEMORY SECTION — Bob's long-term memory + will statements
 *
 * Two purposes:
 * 1. Memory: After conversations, Bob summarizes what he learned
 * 2. Will: Bob's operating values (e.g., "I prefer to ask before sending emails")
 *
 * Bob reads Will on startup and appends to system prompt.
 * Bob reads recent Memory entries to restore context.
 */

// TODO: Implement writeMemory()
// - Takes: { type: 'memory' | 'will', content: string, sessionId?: string }
// - Retrieves memory_db_id from notion_config
// - Calls notion client.pages.create() to add page to memory database
// - Page properties: Type (select), Content (text), Session (text), Timestamp (date), Active (checkbox)
// - Return the page ID
export async function writeMemory(data: {
  type: 'memory' | 'will';
  content: string;
  sessionId?: string;
}): Promise<string | null> {
  // TODO: Implementation
  return null;
}

// TODO: Implement readWill()
// - Retrieves memory_db_id from notion_config
// - Queries memory database for Type = "will" AND Active = true
// - Returns array of will statements: { content }
// - These get appended to Bob's system prompt on startup
export async function readWill(): Promise<string[]> {
  // TODO: Implementation
  return [];
}

// TODO: Implement readMemoriesBySession()
// - Takes: sessionId (conversationId)
// - Retrieves memory_db_id from notion_config
// - Queries memory database for Type = "memory" AND Session = sessionId
// - Returns array: { content, timestamp }
// - Used to restore context at start of conversation
export async function readMemoriesBySession(sessionId: string): Promise<any[]> {
  // TODO: Implementation
  return [];
}

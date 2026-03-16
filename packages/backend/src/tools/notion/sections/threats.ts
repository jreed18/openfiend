import { getNotionClient } from '../client';
import { db } from '@backend/db';
import { notionConfig } from '@backend/db/schema';
import { eq } from 'drizzle-orm';

/**
 * THREATS SECTION — Security event feed
 *
 * Every security event Bob detects gets filed here:
 * - Prompt injection attempts
 * - Phishing emails caught
 * - Suspicious network calls
 * - Unusual file access patterns
 */

// TODO: Implement writeThreat()
// - Takes: { threatType: 'injection' | 'phishing' | 'suspicious-network' | 'file-access' | 'other', source: 'email' | 'webpage' | 'file' | 'calendar' | 'other', snippet: string, actionTaken: string }
// - Retrieves threats_db_id from notion_config
// - Calls notion client.pages.create() to add page to threats database
// - Page properties: Threat Type (title), Source (select), Snippet (text), Action Taken (text), Timestamp (date)
// - Return the page ID
export async function writeThreat(data: {
  threatType: 'injection' | 'phishing' | 'suspicious-network' | 'file-access' | 'other';
  source: 'email' | 'webpage' | 'file' | 'calendar' | 'other';
  snippet: string;
  actionTaken: string;
}): Promise<string | null> {
  // TODO: Implementation
  return null;
}

// TODO: Implement readRecentThreats()
// - Retrieves threats_db_id from notion_config
// - Queries threats database, sorted by Timestamp descending
// - Limit to last 20
// - Returns array: { threatType, source, snippet, actionTaken, timestamp }
export async function readRecentThreats(limit: number = 20): Promise<any[]> {
  // TODO: Implementation
  return [];
}

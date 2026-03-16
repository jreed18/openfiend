import { getNotionClient } from '../client';
import { db } from '@backend/db';
import { notionConfig } from '@backend/db/schema';
import { eq } from 'drizzle-orm';

/**
 * DECISIONS SECTION — Bob's ethical review board
 *
 * This module handles reading/writing/updating decision proposals.
 * Before Bob takes sensitive actions, he writes a structured proposal here.
 * User approves or rejects in Notion, Bob polls for status.
 */

// TODO: Implement writeDecision()
// - Takes: { action, reasoning, risks, riskLevel: 'low' | 'medium' | 'high', tool }
// - Retrieves decisions_db_id from notion_config
// - Calls notion client.pages.create() to add page to decisions database
// - Page properties should match schema (Action, Reasoning, Risks, Risk, Status, Annotation, Timestamp, Tool)
// - Status starts as "pending_approval"
// - Return the page ID for tracking
export async function writeDecision(data: {
  action: string;
  reasoning: string;
  risks: string;
  riskLevel: 'low' | 'medium' | 'high';
  tool: string;
}): Promise<string | null> {
  // TODO: Implementation
  return null;
}

// TODO: Implement readPendingDecisions()
// - Retrieves decisions_db_id from notion_config
// - Queries decisions database for Status = "pending_approval"
// - Returns array of: { pageId, action, reasoning, risks, riskLevel, tool, timestamp }
export async function readPendingDecisions(): Promise<any[]> {
  // TODO: Implementation
  return [];
}

// TODO: Implement updateDecisionStatus()
// - Takes: { pageId, status: 'approved' | 'rejected', annotation? }
// - Updates the Notion page's Status and Annotation fields
// - Return true if successful
export async function updateDecisionStatus(pageId: string, status: 'approved' | 'rejected', annotation?: string): Promise<boolean> {
  // TODO: Implementation
  return false;
}

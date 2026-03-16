import { getNotionClient } from '../client';
import { db } from '@backend/db';
import { notionConfig } from '@backend/db/schema';
import { eq } from 'drizzle-orm';

/**
 * SHADOW SECTION — Shadow mode observations
 *
 * When Bob is in shadow mode (read-only, first 7 days), he logs what he would have done.
 * User reviews in Notion and decides which actions to permanently enable.
 */

// TODO: Implement writeShadowObservation()
// - Takes: { wouldHaveDone: string, tool: string, input: string }
// - Retrieves shadow_db_id from notion_config
// - Calls notion client.pages.create() to add page to shadow-log database
// - Page properties: Would Have Done (title), Tool (text), Input (text), Enabled (checkbox), Timestamp (date)
// - Enabled starts as false
// - Return the page ID
export async function writeShadowObservation(data: {
  wouldHaveDone: string;
  tool: string;
  input: string;
}): Promise<string | null> {
  // TODO: Implementation
  return null;
}

// TODO: Implement readShadowObservations()
// - Retrieves shadow_db_id from notion_config
// - Queries shadow-log database for Enabled = false (unapproved)
// - Returns array: { pageId, wouldHaveDone, tool, input, timestamp }
// - User will review these and check Enabled to approve
export async function readShadowObservations(): Promise<any[]> {
  // TODO: Implementation
  return [];
}

// TODO: Implement markShadowAsEnabled()
// - Takes: pageId
// - Updates the shadow-log page's Enabled checkbox to true
// - Return true if successful
export async function markShadowAsEnabled(pageId: string): Promise<boolean> {
  // TODO: Implementation
  return false;
}

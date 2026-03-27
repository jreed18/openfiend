import { getNotionClient, getDataSourceId } from '../client';
import { getConfigValue } from '../setup';

/**
 * DECISIONS SECTION — Bob's ethical review board
 *
 * This module handles reading/writing/updating decision proposals.
 * Before Bob takes sensitive actions, he writes a structured proposal here.
 * User approves or rejects in Notion, Bob polls for status.
 */

export type DecisionStatus = 'pending_approval' | 'approved' | 'rejected';

export interface NotionDecision {
  pageId: string;
  action: string;
  reasoning: string;
  risks: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: DecisionStatus;
  conversationId: string;
  annotation: string;
  timestamp: string;
  tool: string;
}

// Creates a new decision page in Notion with status "pending_approval"
// Returns the page ID for tracking
export async function writeDecision(data: {
  action: string;
  reasoning: string;
  risks: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: DecisionStatus;
  conversationId: string;
  annotation: string;
  timeStart: string;
  timeEnd?: string;
  tool: string;
}): Promise<string | null> {
  try {
    const client = getNotionClient();
    const decisionsDbId = getConfigValue('decisions_db_id');

    if (!client) {
      console.error('[Notion] Notion client not configured. Skipping decision write.');
      return null;
    }

    if (!decisionsDbId) {
      console.error('[Notion] Decisions database not initialized. Call initializeNotionWorkspace() first.');
      return null;
    }

    console.log('[Notion] Writing decision to Notion database...');

    const response = await client.pages.create({
      parent: {
        type: 'database_id',
        database_id: decisionsDbId,
      },
      properties: {
        Action: { title: [{ text: { content: data.action } }] },
        Reasoning: { rich_text: [{ text: { content: data.reasoning } }] },
        Risks: { rich_text: [{ text: { content: data.risks } }] },
        Risk: { select: { name: data.riskLevel } },
        Status: { select: { name: data.status } },
        ConversationId: { rich_text: [{ text: { content: data.conversationId } }] },
        Annotation: { rich_text: [{ text: { content: data.annotation } }] },
        Timestamp: { date: { start: data.timeStart, end: data.timeEnd } },
        Tool: { rich_text: [{ text: { content: data.tool } }] },
      }
    });

    if (!response?.id) {
      console.error('[Notion] Failed to create decision page: no ID returned');
      return null;
    }

    console.log(`[Notion] Decision page created: ${response.id}`);
    return response.id;
  } catch (err: any) {
    console.error('[Notion] Failed to write decision: ', err.message);
    return null;
  }
}

// Sliding window: only fetch decisions edited since last successful poll
let lastPollTimestamp = new Date(Date.now() - 60_000).toISOString();

export async function readPendingDecisions(): Promise<NotionDecision[]> {
  try {
    const client = getNotionClient();
    const decisionsDbId = getConfigValue('decisions_db_id');

    if (!client || !decisionsDbId) return [];

    const dataSourceId = await getDataSourceId(decisionsDbId);

    if (!dataSourceId) {
      console.error('[Notion] Failed to get data source ID for decisions database');
      return [];
    }

    console.log('[Notion] Reading pending decisions...');

    const notionResult = await client.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        and: [
          {
            or: [
              { property: 'Status', select: { equals: 'pending_approval' } },
              { property: 'Status', select: { equals: 'approved' } },
              { property: 'Status', select: { equals: 'rejected' } },
            ],
          },
          {
            timestamp: 'last_edited_time',
            last_edited_time: { on_or_after: lastPollTimestamp },
          },
        ],
      },
      sorts: [{
        timestamp: 'last_edited_time',
        direction: 'descending',
      }]
    });

    // Advance the sliding window
    if (notionResult.results.length > 0) {
      lastPollTimestamp = (notionResult.results[0] as any).last_edited_time;
    }

    return notionResult.results.map((page: any) => ({
      pageId: page.id,
      action: page.properties.Action.title[0].plain_text,
      reasoning: page.properties.Reasoning.rich_text[0].plain_text,
      risks: page.properties.Risks.rich_text[0].plain_text,
      riskLevel: page.properties.Risk.select.name,
      status: page.properties.Status.select.name,
      conversationId: page.properties.ConversationId.rich_text[0].plain_text,
      annotation: page.properties.Annotation.rich_text[0].plain_text,
      timestamp: page.properties.Timestamp.date.start,
      tool: page.properties.Tool.rich_text[0].plain_text,
    }));
  } catch (err: any) {
    console.error('[Notion] Failed to read pending decisions: ', err.message);
    return [];
  }
}

export async function updateDecisionStatus(pageId: string, status: 'approved' | 'rejected', annotation?: string): Promise<boolean> {
  try {
    const client = getNotionClient();
    const decisionsDbId = getConfigValue('decisions_db_id');

    if (!client || !decisionsDbId) return false;

    console.log('[Notion] Updating decision status...');

    const notionResponse = await client.pages.update({
      page_id: pageId,
      properties: {
        Status: { select: { name: status } },
        ...(annotation && { Annotation: { rich_text: [{ text: { content: annotation } }] } }),
      }
    });

    if (!notionResponse) return false;

    return true;
  } catch (err: any) {
    console.error('[Notion] Failed to update decision status: ', err.message);
    return false;
  }
}

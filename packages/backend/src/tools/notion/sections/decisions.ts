import { callNotionTool, getDataSourceId } from '../mcpClient';
import { getConfigValue } from '../setup';

/**
 * DECISIONS SECTION - Bob's ethical review board
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

function getTextContent(textNodes: any[] | undefined): string {
  if (!Array.isArray(textNodes) || textNodes.length === 0) return '';
  return textNodes[0]?.plain_text || textNodes[0]?.text?.content || '';
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
    const decisionsDbId = getConfigValue('decisions_db_id');

    if (!decisionsDbId) {
      console.error('[Notion] Decisions database not initialized. Call initializeNotionWorkspace() first.');
      return null;
    }

    console.log('[Notion] Writing decision to Notion database...');

    const response = await callNotionTool<any>('API-post-page', {
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
    const decisionsDbId = getConfigValue('decisions_db_id');

    if (!decisionsDbId) return [];

    const dataSourceId = await getDataSourceId(decisionsDbId);

    if (!dataSourceId) {
      console.error('[Notion] Failed to get data source ID for decisions database');
      return [];
    }

    console.log('[Notion] Reading pending decisions...');

    const notionResult = await callNotionTool<any>('API-query-data-source', {
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

    const results = notionResult?.results || [];
    if (!Array.isArray(results)) return [];

    if (results.length > 0) {
      lastPollTimestamp = results[0]?.last_edited_time || lastPollTimestamp;
    }

    return results.map((page: any) => ({
      pageId: page.id,
      action: getTextContent(page.properties?.Action?.title),
      reasoning: getTextContent(page.properties?.Reasoning?.rich_text),
      risks: getTextContent(page.properties?.Risks?.rich_text),
      riskLevel: page.properties?.Risk?.select?.name || 'low',
      status: page.properties?.Status?.select?.name || 'pending_approval',
      conversationId: getTextContent(page.properties?.ConversationId?.rich_text),
      annotation: getTextContent(page.properties?.Annotation?.rich_text),
      timestamp: page.properties?.Timestamp?.date?.start || '',
      tool: getTextContent(page.properties?.Tool?.rich_text),
    }));
  } catch (err: any) {
    console.error('[Notion] Failed to read pending decisions: ', err.message);
    return [];
  }
}

export async function updateDecisionStatus(pageId: string, status: 'approved' | 'rejected', annotation?: string): Promise<boolean> {
  try {
    const decisionsDbId = getConfigValue('decisions_db_id');

    if (!decisionsDbId) return false;

    console.log('[Notion] Updating decision status...');

    await callNotionTool('API-patch-page', {
      page_id: pageId,
      properties: {
        Status: { select: { name: status } },
        ...(annotation && { Annotation: { rich_text: [{ text: { content: annotation } }] } }),
      }
    });

    return true;
  } catch (err: any) {
    console.error('[Notion] Failed to update decision status: ', err.message);
    return false;
  }
}


export async function recoverStaleDecisions(): Promise<NotionDecision[]> {
  try {
    const decisionsDbId = getConfigValue('decisions_db_id');

    if (!decisionsDbId) return [];

    const dataSourceId = await getDataSourceId(decisionsDbId);

    if (!dataSourceId) {
      console.error('[Notion] Failed to get data source ID for decisions database');
      return [];
    }

    console.log('[Notion] Recovering stale decisions...');

    const notionResult = await callNotionTool<any>('API-query-data-source', {
      data_source_id: dataSourceId,
      filter: {
        property: 'Status',
        select: { equals: 'pending_approval' },
      },
    });

    const results = notionResult?.results || [];
    if (!Array.isArray(results)) return [];

    const staleDecisions = results.map((page: any) => ({
      pageId: page.id,
      action: getTextContent(page.properties?.Action?.title),
      reasoning: getTextContent(page.properties?.Reasoning?.rich_text),
      risks: getTextContent(page.properties?.Risks?.rich_text),
      riskLevel: page.properties?.Risk?.select?.name || 'low',
      status: page.properties?.Status?.select?.name || 'pending_approval',
      conversationId: getTextContent(page.properties?.ConversationId?.rich_text),
      annotation: getTextContent(page.properties?.Annotation?.rich_text),
      timestamp: page.properties?.Timestamp?.date?.start || '',
      tool: getTextContent(page.properties?.Tool?.rich_text),
    }));

    await Promise.all(
      staleDecisions.map((decision) =>
        callNotionTool('API-patch-page', {
          page_id: decision.pageId,
          properties: {
            Status: { select: { name: 'rejected' } },
          },
        })
      )
    );

    console.log(`[Notion] Rejected ${staleDecisions.length} stale decisions`);
    return staleDecisions;

  } catch (error: any) {
    console.error(`[Notion] Error recovering stale decisions: ${error.message}`);
    return [];
  }
}

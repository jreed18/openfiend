import { getNotionClient } from '../client';
import { getConfigValue } from '../setup';

/**
 * THREATS SECTION — Security event feed
 *
 * Every security event Bob detects gets filed here:
 * - Prompt injection attempts
 * - Phishing emails caught
 * - Suspicious network calls
 * - Unusual file access patterns
 */

// Writes a new threat event to Notion. Returns the page ID if successful.
export async function writeThreat(data: {
  threatType: 'injection' | 'phishing' | 'suspicious-network' | 'file-access' | 'other';
  source: 'email' | 'webpage' | 'file' | 'calendar' | 'other';
  snippet: string;
  actionTaken: string;
}): Promise<string | null> {
  try {
    const client = getNotionClient();
    const threatsDbId = getConfigValue('threats_db_id');

    if (!client || !threatsDbId) {
      console.error('[Notion] Notion client or threats database not configured. Skipping threat write.');
      return null;
    }

    const notionResponse = await client.pages.create({
      parent: {
        type: 'database_id',
        database_id: threatsDbId,
      },
      properties: {
        'Threat Type': { title: [{ text: { content: data.threatType } }] },
        Source: { select: { name: data.source } },
        Snippet: { rich_text: [{ text: { content: data.snippet } }] },
        'Action Taken': { rich_text: [{ text: { content: data.actionTaken } }] },
        Timestamp: { date: { start: new Date().toISOString() } },
      }
    });

    if (!notionResponse) return null;

    return notionResponse.id;
  } catch (error: any) {
    console.error('[Notion] Failed to write threat: ', error.message);
    return null;
  }
}

// Queries threats database, sorted by Timestamp descending and returns array: { threatType, source, snippet, actionTaken, timestamp }
export async function readRecentThreats(limit: number = 20): Promise<any[]> {
  try {
    const client = getNotionClient();
    const threatsDbId = getConfigValue('threats_db_id');

    if (!client || !threatsDbId) {
      console.error('[Notion] Notion client or threats database not configured. Skipping threats read.');
      return [];
    }

    const notionResult = await client.dataSources.query({
      data_source_id: threatsDbId,
      sorts: [{
        property: 'Timestamp',
        direction: 'descending',
      }],
      page_size: limit,
    });

    if (!notionResult?.results) {
      console.error('[Notion] No results returned when querying threats database');
      return [];
    }

    return notionResult.results.map((page: any) => ({
      threatType: page.properties['Threat Type']?.title?.[0]?.text?.content || '',
      source: page.properties['Source']?.select?.name || '',
      snippet: page.properties['Snippet']?.rich_text?.[0]?.text?.content || '',
      actionTaken: page.properties['Action Taken']?.rich_text?.[0]?.text?.content || '',
      timestamp: page.properties['Timestamp']?.date?.start || '',
    }));
  } catch (error: any) {
    console.error('[Notion] Failed to read threats: ', error.message);
    return [];
  }
}

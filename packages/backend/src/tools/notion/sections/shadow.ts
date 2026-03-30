import { getNotionClient } from '../client';
import { getConfigValue } from '../setup';

/**
 * SHADOW SECTION — Shadow mode observations
 *
 * When Bob is in shadow mode (read-only, first 7 days), he logs what he would have done.
 * User reviews in Notion and decides which actions to permanently enable.
 */

// Writes a new shadow observation to Notion. Returns the page ID if successful.
export async function writeShadowObservation(data: {
  wouldHaveDone: string;
  tool: string;
  input: string;
}): Promise<string | null> {
  try {
    const client = getNotionClient();
    const shadowDbId = getConfigValue('shadow_db_id');

    if (!client || !shadowDbId) {
      console.error('[Notion] Notion client or shadow database not configured. Skipping shadow observation write.');
      return null;
    }

    const notionResponse = await client.pages.create({
      parent: {
        type: 'database_id',
        database_id: shadowDbId,
      },
      properties: {
        'Would Have Done': { title: [{ text: { content: data.wouldHaveDone } }] },
        Tool: { rich_text: [{ text: { content: data.tool } }] },
        Input: { rich_text: [{ text: { content: data.input } }] },
        Enabled: { checkbox: false },
        Timestamp: { date: { start: new Date().toISOString() } },
      }
    });

    if (!notionResponse) return null;

    return notionResponse.id;
  } catch (error: any) {
    console.error('[Notion] Failed to write shadow observation: ', error.message);
    return null;
  }
}

//  Retrieves shadow_db_id from notion_config
export async function readShadowObservations(): Promise<any[]> {
  try {
    const client = getNotionClient();
    const shadowDbId = getConfigValue('shadow_db_id');

    if (!client || !shadowDbId) {
      console.error('[Notion] Notion client or shadow database not configured. Skipping shadow observations read.');
      return [];
    }

    const notionResponse = await client.dataSources.query({
      data_source_id: shadowDbId,
      filter: {
        property: 'Enabled',
        checkbox: { equals: false },
      },
      sorts: [{
        property: 'Timestamp',
        direction: 'descending',
      }],
    });

    if (!notionResponse?.results) {
      console.error('[Notion] No results returned when querying shadow observations database');
      return [];
    }

    return notionResponse.results.map((page: any) => ({
      pageId: page.id,
      wouldHaveDone: page.properties['Would Have Done']?.title?.[0]?.text?.content || '',
      tool: page.properties['Tool']?.rich_text?.[0]?.text?.content || '',
      input: page.properties['Input']?.rich_text?.[0]?.text?.content || '',
      timestamp: page.properties['Timestamp']?.date?.start || '',
    }));
  } catch (error: any) {
    console.error('[Notion] Failed to read shadow observations: ', error.message);
    return [];
  }
}

// Updates the shadow-log page's Enabled checkbox to true and returns true if successful
export async function markShadowAsEnabled(pageId: string): Promise<boolean> {
  try {
    const client = getNotionClient();
    const shadowDbId = getConfigValue('shadow_db_id');

    if (!client || !shadowDbId) {
      console.error('[Notion] Notion client or shadow database not configured. Skipping mark shadow as enabled.');
      return false;
    }

    const notionResponse = await client.pages.update({
      page_id: pageId,
      properties: {
        Enabled: { checkbox: true },
      }
    });

    if (!notionResponse) return false;

    return true;
  } catch (error: any) {
    console.error('[Notion] Failed to mark shadow observation as enabled: ', error.message);
    return false;
  }
}

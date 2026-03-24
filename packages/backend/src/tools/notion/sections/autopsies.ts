import { getNotionClient } from '../client';
import { getConfigValue } from '../setup';

/**
 * AUTOPSIES SECTION — Bob's failure reports
 *
 * When something goes wrong, Bob automatically writes a post-mortem.
 * This helps Bob learn from mistakes and users understand failures.
 */

export async function writeAutopsy(data: {
  whatHappened: string;
  intent: string;
  reality: string;
  cause: string;
  learning: string;
  severity: 'minor' | 'significant' | 'critical';
}): Promise<string | null> {
  try {
    const client = getNotionClient();
    const autopsiesDbId = getConfigValue('autopsies_db_id');

    if (!client || !autopsiesDbId) return null;

    const response = await client.pages.create({
      parent: {
        type: 'database_id',
        database_id: autopsiesDbId,
      },
      properties: {
        'What Happened': { title: [{ text: { content: data.whatHappened } }] },
        Intent: { rich_text: [{ text: { content: data.intent } }] },
        Reality: { rich_text: [{ text: { content: data.reality } }] },
        Cause: { rich_text: [{ text: { content: data.cause } }] },
        Learning: { rich_text: [{ text: { content: data.learning } }] },
        Severity: { select: { name: data.severity } },
        Timestamp: { date: { start: new Date().toISOString() } },
      }
    });

    return response.id;
  } catch (error) {
    console.error('[Notion] Failed to write autopsy: ', error);
    return null;
  }
}

export async function readRecentAutopsies(limit: number = 10): Promise<any[]> {
  try {
    const client = getNotionClient();
    const autopsiesDbId = getConfigValue('autopsies_db_id');

    if (!client || !autopsiesDbId) return [];

    console.log("[Notion] Reading recent autopsy reports...");

    const notionResult = await client.dataSources.query({
      data_source_id: autopsiesDbId,
      sorts: [{
        property: 'Timestamp',
        direction: 'descending',
      }],
      page_size: limit,
    });

    if (!notionResult?.results) {
      console.error('[Notion] No results returned when querying autopsies database');
      return [];
    }

    return notionResult.results.map((page: any) => ({
      whatHappened: page.properties['What Happened']?.title?.[0]?.text?.content || '',
      severity: page.properties['Severity']?.select?.name || '',
      cause: page.properties['Cause']?.rich_text?.[0]?.text?.content || '',
      timestamp: page.properties['Timestamp']?.date?.start || '',
    }));

  } catch (error: any) {
    console.error('[Notion] Failed to read autopsies: ', error.message);
    return [];
  }
}

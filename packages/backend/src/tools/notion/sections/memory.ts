import { getNotionClient } from '../client';
import { getConfigValue } from '../setup';

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

// Writes a new memory or will statement to Notion. Returns the page ID if successful.
export async function writeMemory(data: {
  type: 'memory' | 'will';
  content: string;
  sessionId?: string;
}): Promise<string | null> {
  try {
    const client = getNotionClient();
    const memoryDbId = getConfigValue('memory_db_id');

    if (!client || !memoryDbId) {
      console.error('[Notion] Notion client or memory database not configured. Skipping memory write.');
      return null;
    }

    const notionResponse = await client.pages.create({
      parent: {
        type: 'database_id',
        database_id: memoryDbId,
      },
      properties: {
        Name: { title: [{ text: { content: `${data.type} - ${new Date().toLocaleString()}` } }] },
        Type: { select: { name: data.type } },
        Content: { rich_text: [{ text: { content: data.content } }] },
        Session: { rich_text: [{ text: { content: data.sessionId || '' } }] },
        Timestamp: { date: { start: new Date().toISOString() } },
        Active: { checkbox: true },
      }
    });

    if (!notionResponse) return null;

    return notionResponse.id;
  } catch (err: any) {
    console.error('[Notion] Failed to write memory: ', err.message);
    return null;
  }
}

// Queries memory database for Type = "will" AND Active = true and returns array of will statements: { content }
export async function readWill(): Promise<string[]> {
  try {
    const client = getNotionClient();
    const memoryDbId = getConfigValue('memory_db_id');

    if (!client || !memoryDbId) {
      console.error('[Notion] Notion client or memory database not configured. Skipping will read.');
      return [];
    }

    const notionResult = await client.dataSources.query({
      data_source_id: memoryDbId,
      filter: {
        and: [
          { property: 'Type', select: { equals: 'will' } },
          { property: 'Active', select: { equals: 'true' } }
        ]
      },
      sorts: [{
        property: 'Timestamp',
        direction: 'descending',
      }],
    });

    if (!notionResult) return [];

    return notionResult.results.map((page: any) => {
      const content = page.properties.Content?.rich_text?.[0]?.text?.content || '';
      return content;
    });
  } catch (error: any) {
    console.error('[Notion] Failed to read will statements: ', error.message);
    return [];
  }
}

// Queries memory database for Type = "memory" AND Session = sessionId and returns array: { content, timestamp }
export async function readMemoriesBySession(sessionId: string): Promise<any[]> {
  try {
    const client = getNotionClient();
    const memoryDbId = getConfigValue('memory_db_id');

    if (!client || !memoryDbId) {
      console.error('[Notion] Notion client or memory database not configured. Skipping memory read.');
      return [];
    }

    const notionResult = await client.dataSources.query({
      data_source_id: memoryDbId,
      filter: {
        and: [
          { property: 'Type', select: { equals: 'memory' } },
          { property: 'Session', rich_text: { equals: sessionId } }
        ]
      },
      sorts: [{
        property: 'Timestamp',
        direction: 'descending',
      }],
    });

    if (!notionResult) return [];

    return notionResult.results.map((page: any) => {
      const content = page.properties.Content?.rich_text?.[0]?.text?.content || '';
      const timestamp = page.properties.Timestamp?.date?.start || '';
      return { content, timestamp };
    });
  } catch (error: any) {
    console.error('[Notion] Failed to read memories by session: ', error.message);
    return [];
  }
}

export async function readWillBySession(sessionId: string): Promise<string[]> {
  try {
    const client = getNotionClient();
    const memoryDbId = getConfigValue('memory_db_id');
    
    if (!client || !memoryDbId) {
      console.error('[Notion] Notion client or memory database not configured. Skipping will by session read.');
      return [];
    }

    const notionResult = await client.dataSources.query({
      data_source_id: memoryDbId,
      filter: {
        and: [
          { property: 'Type', select: { equals: 'will' } },
          { property: 'Session', rich_text: { equals: sessionId } }
        ]
      },
      sorts: [{
        property: 'Timestamp',
        direction: 'descending',
      }],
    });

    if (!notionResult) return [];

    return notionResult.results.map((page: any) => {
      // For will statements, we only care about the content
      const content = page.properties.Content?.rich_text?.[0]?.text?.content || '';
      return content;
    });
  } catch (error: any) {
    console.error('[Notion] Failed to read will statements by session: ', error.message);
    return [];
  }
}


export async function readRecentMemories(limit: number = 10): Promise<any[]> {
  try {
    const client = getNotionClient();
    const memoryDbId = getConfigValue('memory_db_id');

    if (!client || !memoryDbId) return [];

    const notionResult = await client.dataSources.query({
      data_source_id: memoryDbId,
      filter: {
        property: 'Type',
        select: { equals: 'memory' }
      },
      sorts: [{
        property: 'Timestamp',
        direction: 'descending',
      }],
      page_size: limit,
    });

    if (!notionResult) return [];

    return notionResult.results.map((page: any) => ({
      content: page.properties.Content?.rich_text?.[0]?.text?.content || '',
      timestamp: page.properties.Timestamp?.date?.start || '',
    }));
  } catch (error: any) {
    console.error('[Notion] Failed to read memories: ', error.message);
    return [];
  }
}

export async function readRecentWill(limit: number = 10): Promise<string[]> {
  try {
    const client = getNotionClient();
    const memoryDbId = getConfigValue('memory_db_id');

    if (!client || !memoryDbId) return [];

    const notionResult = await client.dataSources.query({
      data_source_id: memoryDbId,
      filter: {
        property: 'Type',
        select: { equals: 'will' }
      },
      sorts: [{
        property: 'Timestamp',
        direction: 'descending',
      }],
      page_size: limit,
    });

    if (!notionResult) return [];

    return notionResult.results.map((page: any) => 
      page.properties.Content?.rich_text?.[0]?.text?.content || ''
    );
  } catch (error: any) {
    console.error('[Notion] Failed to read will statements: ', error.message);
    return [];
  }
}

import { getNotionClient } from './client';
import { notionConfig } from "@backend/db/schema";
import { db } from "@backend/db";
import { eq } from "drizzle-orm";

// Get a config value from the notion_config table by key
export function getConfigValue(key: string): string | null {
  const notionConfigEntry = db.select().from(notionConfig)
  .where(eq(notionConfig.key, key)).get();

  if (!notionConfigEntry) return null;

  return notionConfigEntry.value;
}

// Store a config value in the notion_config table (key-value pair)
export function storeConfigValue(key: string, value: string): void {
    try {  
        const valueExists = getConfigValue(key);
        if (!valueExists) {
            db.insert(notionConfig).values({
                key: key,
                value: value,
            }).run();
            console.log(`'${key}' with value '${value}' succesfully added to configurations!`);
            return;
        }
    }
    catch (err: any) {
        console.error(`Failed to add ${key} with value ${value} to configurations. Reason: ${err.message}`);
    }
}

// Initializes the Notion workspace by creating necessary databases and storing their IDs in the notion_config table
export async function initializeNotionWorkspace(): Promise<void> {
  const rootPageValue = getConfigValue('root_page_id');
  if (rootPageValue) {
    console.log('[Notion] OpenFiend workspace already configured');
    return;
  }

  const client = getNotionClient();
  if (!client) {
    console.warn('[Notion] Notion token not configured. Skipping workspace initialization.');
    return;
  }

  try {
    console.log('[Notion] Initializing OpenFiend workspace...');

    const rootPageId = process.env.NOTION_OPENFIEND_WORKSPACE_PAGE_ID;
    if (!rootPageId) {
      console.error('[Notion] NOTION_OPENFIEND_WORKSPACE_PAGE_ID not set in environment. Please create an "OpenFiend workspace" page in Notion and add its ID to .env.local');
      return;
    }

    storeConfigValue('root_page_id', rootPageId);
    console.log('[Notion] Root page ID stored');

    // create decisions database
    console.log('[Notion] Creating Decisions database...');
    const decisionsDbResponse = await client.databases.create({
      parent: { type: 'page_id', page_id: rootPageId },
      title: [{ type: 'text', text: { content: 'Decisions' } }],
      initial_data_source: {
        properties: {
          Action: { title: {} },
          Reasoning: { rich_text: {} },
          Risks: { rich_text: {} },
          Risk: { select: { options: [
            { name: 'low', color: 'green' },
            { name: 'medium', color: 'yellow' },
            { name: 'high', color: 'red' },
          ]}},
          Status: { select: { options: [
            { name: 'pending_approval', color: 'yellow' },
            { name: 'approved', color: 'green' },
            { name: 'rejected', color: 'red' },
          ]}},
          ConversationId: { rich_text: {} },
          Annotation: { rich_text: {} },
          Timestamp: { date: {} },
          Tool: { rich_text: {} }
        }
      }
    });
    storeConfigValue('decisions_db_id', decisionsDbResponse.id);
    console.log('[Notion] Decisions database created');

    // create memory database
    console.log('[Notion] Creating Memory database...');
    const memoryDbResponse = await client.databases.create({
      parent: { type: 'page_id', page_id: rootPageId },
      title: [{ type: 'text', text: { content: 'Memory' } }],
      initial_data_source: {
        properties: {
          Name: { title: {} },
          Type: { select: { options: [
            { name: 'memory' },
            { name: 'will' }
          ]}},
          Content: { rich_text: {} },
          Session: { rich_text: {} },
          Timestamp: { date: {} },
          Active: { checkbox: {} },
        }
      }
    });
    storeConfigValue('memory_db_id', memoryDbResponse.id);
    console.log('[Notion] Memory database created');

    // create autopsies database
    console.log('[Notion] Creating Autopsies database...');
    const autopsiesDbResponse = await client.databases.create({
      parent: { type: 'page_id', page_id: rootPageId },
      title: [{ type: 'text', text: { content: 'Autopsies' } }],
      initial_data_source: {
        properties: {
          'What Happened': { title: {} },
          Intent: { rich_text: {} },
          Reality: { rich_text: {} },
          Cause: { rich_text: {} },
          Learning: { rich_text: {} },
          Severity: { select: { options: [
            { name: 'minor', color: 'blue' },
            { name: 'significant', color: 'yellow' },
            { name: 'critical', color: 'red' },
          ]}},
          Timestamp: { date: {} }
        }
      }
    });
    storeConfigValue('autopsies_db_id', autopsiesDbResponse.id);
    console.log('[Notion] Autopsies database created');

    // create threats database
    console.log('[Notion] Creating Threats database...');
    const threatsDbResponse = await client.databases.create({
      parent: { type: 'page_id', page_id: rootPageId },
      title: [{ type: 'text', text: { content: 'Threats' } }],
      initial_data_source: {
        properties: {
          'Threat Type': { title: {} },
          Source: { select: { options: [
              { name: 'email', color: 'red' },
              { name: 'webpage', color: 'orange' },
              { name: 'file', color: 'yellow' },
              { name: 'calendar', color: 'blue' },
              { name: 'other', color: 'gray' },
          ]}},
          Snippet: { rich_text: {} },
          'Action Taken': { rich_text: {} },
          Timestamp: { date: {} }
        }
      }
    });
    storeConfigValue('threats_db_id', threatsDbResponse.id);
    console.log('[Notion] Threats database created');

    // create shadow-log database
    console.log('[Notion] Creating Shadow Log database...');
    const shadowDbResponse = await client.databases.create({
      parent: { type: 'page_id', page_id: rootPageId },
      title: [{ type: 'text', text: { content: 'Shadow Log' } }],
      initial_data_source: {
        properties: {
          'Would Have Done': { title: {} },
          Tool: { rich_text: {} },
          Input: { rich_text: {} },
          Enabled: { checkbox: {} },
          Timestamp: { date: {} }
        }
      }
    });
    storeConfigValue('shadow_db_id', shadowDbResponse.id);
    console.log('[Notion] Shadow Log database created');

    console.log('[Notion] OpenFiend workspace successfully initialized');
  } catch (err: any) {
    console.error('[Notion] Workspace initialization failed:', err.message);
    console.error('[Notion] Make sure NOTION_TOKEN and NOTION_OPENFIEND_WORKSPACE_PAGE_ID are correctly set');
  }
}
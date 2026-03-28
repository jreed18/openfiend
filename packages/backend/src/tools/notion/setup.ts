import { getNotionClient } from './client';
import { notionConfig } from "@backend/db/schema";
import { db } from "@backend/db";
import { eq } from "drizzle-orm";

type StoreConfigResult = 'inserted' | 'exists';

// Get a config value from the notion_config table by key
export function getConfigValue(key: string): string | null {
  const notionConfigEntry = db.select().from(notionConfig)
  .where(eq(notionConfig.key, key)).get();

  if (!notionConfigEntry) return null;

  return notionConfigEntry.value;
}

// Store a config value in the notion_config table (key-value pair)
export function storeConfigValue(key: string, value: string): StoreConfigResult {
    const valueExists = getConfigValue(key);
      if (!valueExists) {
          db.insert(notionConfig).values({
              key: key,
              value: value,
          }).run();
          console.log(`'${key}' with value '${value}' succesfully added to configurations!`);
          return 'inserted';
      }
      console.log(`'${key}' already exists in configurations. Skipping insert.`);
      return 'exists';
}

// Initializes the Notion workspace by creating necessary databases and storing their IDs in the notion_config table
export async function initializeNotionWorkspace(): Promise<void> {
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

    const persistConfigOrThrow = (key: string, value: string) => {
      const result = storeConfigValue(key, value);
      const persistedValue = getConfigValue(key);
      if (!persistedValue) {
        throw new Error(`Config key "${key}" was not persisted`);
      }
      if (persistedValue !== value) {
        throw new Error(`Config key "${key}" already exists with a different value`);
      }
      if (result === 'inserted') {
        console.log(`[Notion] Stored ${key}`);
      } else {
        console.log(`[Notion] ${key} already stored`);
      }
    };

    persistConfigOrThrow('root_page_id', rootPageId);

    // create decisions database
    if (!getConfigValue('decisions_db_id')) {
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
      persistConfigOrThrow('decisions_db_id', decisionsDbResponse.id);
      console.log('[Notion] Decisions database created');
    }

    // create memory database
    if (!getConfigValue('memory_db_id')) {
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
      persistConfigOrThrow('memory_db_id', memoryDbResponse.id);
      console.log('[Notion] Memory database created');
    }

    // create autopsies database
    if (!getConfigValue('autopsies_db_id')) {
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
      persistConfigOrThrow('autopsies_db_id', autopsiesDbResponse.id);
      console.log('[Notion] Autopsies database created');
    }

    // create threats database
    if (!getConfigValue('threats_db_id')) {
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
      persistConfigOrThrow('threats_db_id', threatsDbResponse.id);
      console.log('[Notion] Threats database created');
    }

    // create shadow-log database
    if (!getConfigValue('shadow_db_id')) {
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
      persistConfigOrThrow('shadow_db_id', shadowDbResponse.id);
      console.log('[Notion] Shadow Log database created');
    }

    // create tasks database
    if (!getConfigValue('tasks_db_id')) {
      console.log('[Notion] Creating Tasks database...');
      const tasksDbResponse = await client.databases.create({
        parent: { type: 'page_id', page_id: rootPageId },
        title: [{ type: 'text', text: { content: 'Tasks' } }],
        initial_data_source: {
          properties: {
            Description: { title: {} },
            Priority: { select: { options: [
              { name: 'low', color: 'blue' },
              { name: 'medium', color: 'yellow' },
              { name: 'high', color: 'red' },
            ]}},
            Status: { select: { options: [
              { name: 'pending', color: 'yellow' },
              { name: 'in_progress', color: 'blue' },
              { name: 'completed', color: 'green' },
              { name: 'failed', color: 'red' },
            ]}},
            Result: { rich_text: {} },
            ScheduledFor: { date: {} },
            TimestampStarted: { date: {} },
            TimestampCompleted: { date: {} },
          }
        }
      });
      persistConfigOrThrow('tasks_db_id', tasksDbResponse.id);
      console.log('[Notion] Tasks database created');
    }

    console.log('[Notion] OpenFiend workspace successfully initialized');
  } catch (err: any) {
    console.error('[Notion] Workspace initialization failed: ', err.message);
    console.error('[Notion] Make sure NOTION_TOKEN and NOTION_OPENFIEND_WORKSPACE_PAGE_ID are correctly set');
  }
}

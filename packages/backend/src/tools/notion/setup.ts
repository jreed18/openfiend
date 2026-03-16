import { getNotionClient } from './client';
import { notionConfig } from "@backend/db/schema";
import { db } from "@backend/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

// TODO: Implement getConfigValue(key: string): string | null
// - Query notion_config table for the given key
// - Return value if found, null otherwise
function getConfigValue(key: string): string | null {
  const notionConfigEntry = db.select().from(notionConfig)
  .where(eq(notionConfig.key, key)).get();

  if (!notionConfigEntry) return null;

  return notionConfigEntry.value;
}

// TODO: Implement storeConfigValue(key: string, value: string): void
// - Insert or update notion_config with key-value pair
function storeConfigValue(key: string, value: string): void {
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

// TODO: Implement initializeNotionWorkspace(): Promise<void>
// - Get Notion client from getNotionClient()
// - Check if 'root_page_id' exists in notion_config using getConfigValue()
// - If exists, log "OpenFiend workspace already configured" and return early
// - If not exists:
//   1. Get root page ID from process.env.NOTION_OPENFIEND_WORKSPACE_PAGE_ID
//      - This is created manually by user in Notion (format: 32-char hex string after last dash in URL)
//      - If not set, log error and return
//   2. Store root_page_id in notion_config
//   3. Create decisions database (parent: { page_id: rootPageId })
//      - Title: "Decisions"
//      - Properties: Action (title), Reasoning (text), Risks (text), Risk (select: low/medium/high), Status (select: pending_approval/approved/rejected), Annotation (text), Timestamp (date), Tool (text)
//   4. Create memory database (parent: { page_id: rootPageId })
//      - Title: "Memory"
//      - Properties: Type (select: memory/will), Content (text), Session (text), Timestamp (date), Active (checkbox)
//   5. Create autopsies database (parent: { page_id: rootPageId })
//      - Title: "Autopsies"
//      - Properties: What Happened (title), Intent (text), Reality (text), Cause (text), Learning (text), Severity (select: minor/significant/critical), Timestamp (date)
//   6. Create threats database (parent: { page_id: rootPageId })
//      - Title: "Threats"
//      - Properties: Threat Type (title), Source (select: email/webpage/file/calendar/other), Snippet (text), Action Taken (text), Timestamp (date)
//   7. Create shadow-log database (parent: { page_id: rootPageId })
//      - Title: "Shadow Log"
//      - Properties: Would Have Done (title), Tool (text), Input (text), Enabled (checkbox), Timestamp (date)
//   8. Store all 5 database IDs in notion_config: decisions_db_id, memory_db_id, autopsies_db_id, threats_db_id, shadow_db_id
//   9. Log "OpenFiend workspace created successfully"
// - Handle errors gracefully (log but don't crash if Notion unavailable)
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
import { Client } from "@notionhq/client";

let notionClient: Client | null = null;

export function getNotionClient(): Client | null {
    if (!process.env.NOTION_TOKEN) return null;

    if (!notionClient) {
        notionClient = new Client({
            auth: process.env.NOTION_TOKEN,
        });
    }

    return notionClient
}

const dataSourceCache = new Map<string, string>();

export async function getDataSourceId(databaseId: string): Promise<string | null> {
    if (dataSourceCache.has(databaseId)) {
        return dataSourceCache.get(databaseId)!;
    }

    const client = getNotionClient();
    if (!client) return null;

    try {
        const db = await client.databases.retrieve({ database_id: databaseId });

        if (!("data_sources" in db)) {
            throw new Error("Received partial database response");
        }

        const dataSourceId = db.data_sources[0].id;
        
        if (dataSourceId) {
            dataSourceCache.set(databaseId, dataSourceId);
        }
        return dataSourceId || null;
    } catch (error: any) {
        console.error(`[Notion] Failed to retrieve data source ID for database ${databaseId}: `, error.message);
        return null;
    }
}

export function isNotionConfigured(): boolean {
    return !!process.env.NOTION_TOKEN;
}

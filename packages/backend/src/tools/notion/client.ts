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

export function isNotionConfigured(): boolean {
    return !!process.env.NOTION_TOKEN;
}

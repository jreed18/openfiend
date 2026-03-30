import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

let mcpClient: Client | null = null;
let mcpConnectPromise: Promise<Client> | null = null;
const dataSourceCache = new Map<string, string>();

function getMcpCommand(): string {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}

async function connectMcpClient(): Promise<Client> {
  const client = new Client({ name: 'openfiend-notion-mcp', version: '0.1.0' });
  const transport = new StdioClientTransport({
    command: getMcpCommand(),
    args: ['-y', '@notionhq/notion-mcp-server'],
    env: {
      ...process.env,
      NOTION_TOKEN: process.env.NOTION_TOKEN || '',
    },
  });

  await client.connect(transport);
  return client;
}

export async function getNotionMcpClient(): Promise<Client> {
  if (mcpClient) return mcpClient;
  if (!mcpConnectPromise) {
    mcpConnectPromise = connectMcpClient();
  }
  mcpClient = await mcpConnectPromise;
  return mcpClient;
}

export async function callNotionTool<T = any>(name: string, args: Record<string, any>): Promise<T> {
  const client = await getNotionMcpClient();
  const response: any = await client.callTool({ name, arguments: args });
  const first = response?.content?.[0];
  const text = first && 'text' in first ? first.text : '';

  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return ({ raw: text } as unknown) as T;
  }
}

export async function getDataSourceId(databaseId: string): Promise<string | null> {
  if (dataSourceCache.has(databaseId)) {
    return dataSourceCache.get(databaseId)!;
  }

  try {
    const db = await callNotionTool<any>('API-retrieve-a-database', {
      database_id: databaseId,
    });
    const dataSourceId = db?.data_sources?.[0]?.id ?? null;
    if (dataSourceId) dataSourceCache.set(databaseId, dataSourceId);
    return dataSourceId;
  } catch (error: any) {
    console.error(`[Notion MCP] Failed to get data source for database ${databaseId}:`, error?.message || error);
    return null;
  }
}

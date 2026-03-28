import { getNotionClient, getDataSourceId } from '../client';
import { getConfigValue } from '../setup';

/**
 * TASKS SECTION - Bob's async task queue stored in Notion
 * 
 * Users leave tasks in Notion, Bob picks them up and completes them.
 */

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface NotionTask {
    pageId: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    result: string;
    scheduledFor?: string;
    timestampStarted: string;
    timestampCompleted: string;
}

export async function writeTask(data: {
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    result?: string;
    scheduledFor?: string;
}): Promise<string | null> {
    try {
        const client = getNotionClient();
        const tasksDbId = getConfigValue('tasks_db_id');

        if (!client || !tasksDbId) {
            console.error('[Notion] Notion client or tasks database not configured. Skipping task write.');
            return null;
        }

        const notionResponse = await client.pages.create({
            parent: {
                type: 'database_id',
                database_id: tasksDbId,
            },
            properties: {
                Description: { title: [{ text: { content: data.description } }] },
                Priority: { select: { name: data.priority } },
                Status: { select: { name: data.status } },
                Result: { rich_text: [{ text: { content: data.result || '' } }] },
                ...(data.scheduledFor
                    ? { ScheduledFor: { date: { start: data.scheduledFor } } }
                    : {}),
                TimestampStarted: { date: { start: new Date().toISOString() } },
            }
        });

        if (!notionResponse) return null;

        console.log('[Notion] Successfully wrote task to Notion with page ID:', notionResponse.id);
        return notionResponse.id;
    } catch (error) {
        console.error('[Notion] Error writing task:', error);
        return null;
    }
}

export async function readPendingTasks(): Promise<NotionTask[]> {
    try {
        const client = getNotionClient();
        const tasksDbId = getConfigValue('tasks_db_id');

        if (!client || !tasksDbId) {
            console.error('[Notion] Notion client or tasks database not configured. Skipping task read.');
            return [];
        }

        const dataSourceId = await getDataSourceId(tasksDbId);

        if (!dataSourceId) {
            console.error('[Notion] Failed to get data source ID for tasks database');
            return [];
        }

        const notionResult = await client.dataSources.query({
            data_source_id: dataSourceId,
            filter: {
                property: 'Status',
                select: { equals: 'pending' },
            },
            sorts: [{
                property: 'Priority',
                direction: 'descending', // high priority first
            }],
        });

        if (!notionResult || !notionResult.results) return [];

        console.log('[Notion] Successfully read pending tasks from Notion. Number of tasks:', notionResult.results.length);

        return notionResult.results.map((page: any) => ({
            pageId: page.id,
            description: page.properties.Description?.title?.[0]?.text?.content || '',
            priority: page.properties.Priority?.select?.name || 'low',
            status: page.properties.Status?.select?.name || 'pending',
            result: page.properties.Result?.rich_text?.[0]?.text?.content || '',
            scheduledFor: page.properties.ScheduledFor?.date?.start || '',
            timestampStarted: page.properties.TimestampStarted?.date?.start || '',
            timestampCompleted: page.properties.TimestampCompleted?.date?.start || '',
        }));

    } catch (error) {
        console.error('[Notion] Error reading tasks:', error);
        return [];
    }
}

export async function updateTaskStatus(
    pageId: string,
    status: TaskStatus,
    result?: string,
): Promise<boolean> {
    try {
        const client = getNotionClient();
        if (!client) return false;

        const properties: Record<string, any> = {
            Status: { select: { name: status } },
        };

        if (result !== undefined) {
            properties.Result = { rich_text: [{ text: { content: result } }] };
        }

        if (status === 'in_progress') {
            properties.TimestampStarted = { date: { start: new Date().toISOString() } };
        }

        if (status === 'completed' || status === 'failed') {
            properties.TimestampCompleted = { date: { start: new Date().toISOString() } };
        }

        await client.pages.update({
            page_id: pageId,
            properties,
        });

        console.log(`[Notion] Successfully updated task ${pageId} to status ${status}`);
        return true;
    } catch (error) {
        console.error('[Notion] Error updating task status: ', error);
        return false;
    }
}
import { callNotionTool, getDataSourceId } from '../mcpClient';
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

function getTextContent(textNodes: any[] | undefined): string {
    if (!Array.isArray(textNodes) || textNodes.length === 0) return '';
    return textNodes[0]?.plain_text || textNodes[0]?.text?.content || '';
}

export async function writeTask(data: {
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    result?: string;
    scheduledFor?: string;
}): Promise<string | null> {
    try {
        const tasksDbId = getConfigValue('tasks_db_id');

        if (!tasksDbId) {
            console.error('[Notion] Tasks database not configured. Skipping task write.');
            return null;
        }

        const notionResponse = await callNotionTool<any>('API-post-page', {
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

        if (!notionResponse?.id) return null;

        console.log('[Notion] Successfully wrote task to Notion with page ID:', notionResponse.id);
        return notionResponse.id;
    } catch (error) {
        console.error('[Notion] Error writing task:', error);
        return null;
    }
}

export async function readPendingTasks(): Promise<NotionTask[]> {
    try {
        const tasksDbId = getConfigValue('tasks_db_id');

        if (!tasksDbId) {
            console.error('[Notion] Tasks database not configured. Skipping task read.');
            return [];
        }

        const dataSourceId = await getDataSourceId(tasksDbId);

        if (!dataSourceId) {
            console.error('[Notion] Failed to get data source ID for tasks database');
            return [];
        }

        const notionResult = await callNotionTool<any>('API-query-data-source', {
            data_source_id: dataSourceId,
            filter: {
                property: 'Status',
                select: { equals: 'pending' },
            },
            sorts: [{
                property: 'Priority',
                direction: 'descending',
            }],
        });

        const results = notionResult?.results || [];
        if (!Array.isArray(results)) return [];

        console.log('[Notion] Successfully read pending tasks from Notion. Number of tasks:', results.length);

        return results.map((page: any) => ({
            pageId: page.id,
            description: getTextContent(page.properties?.Description?.title),
            priority: page.properties?.Priority?.select?.name || 'low',
            status: page.properties?.Status?.select?.name || 'pending',
            result: getTextContent(page.properties?.Result?.rich_text),
            scheduledFor: page.properties?.ScheduledFor?.date?.start || '',
            timestampStarted: page.properties?.TimestampStarted?.date?.start || '',
            timestampCompleted: page.properties?.TimestampCompleted?.date?.start || '',
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

        await callNotionTool('API-patch-page', {
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

export async function recoverStaleTasks(): Promise<NotionTask[]> {
    try {
        const tasksDbId = getConfigValue('tasks_db_id');

        if (!tasksDbId) {
            console.error('[Notion] Tasks database not configured. Skipping stale task recovery.');
            return [];
        }

        const dataSourceId = await getDataSourceId(tasksDbId);
        if (!dataSourceId) {
            console.error('[Notion] Failed to get data source ID for tasks database');
            return [];
        }

        const notionResult = await callNotionTool<any>('API-query-data-source', {
            data_source_id: dataSourceId,
            filter: {
                property: 'Status',
                select: { equals: 'in_progress' },
            },
        });

        const results = notionResult?.results || [];
        if (!Array.isArray(results) || results.length === 0) {
            return [];
        }

        const staleTasks: NotionTask[] = results.map((page: any) => ({
            pageId: page.id,
            description: getTextContent(page.properties?.Description?.title),
            priority: page.properties?.Priority?.select?.name || 'low',
            status: 'pending',
            result: getTextContent(page.properties?.Result?.rich_text),
            scheduledFor: page.properties?.ScheduledFor?.date?.start || '',
            timestampStarted: page.properties?.TimestampStarted?.date?.start || '',
            timestampCompleted: '',
        }));

        await Promise.all(
            staleTasks.map((task) =>
                callNotionTool('API-patch-page', {
                    page_id: task.pageId,
                    properties: {
                        Status: { select: { name: 'pending' } },
                    },
                })
            )
        );

        console.log(`[Notion] Recovered ${staleTasks.length} stale in-progress tasks`);
        return staleTasks;

    } catch (error) {
        console.error('[Notion] Error recovering stale tasks:', error);
        return [];
    }
}

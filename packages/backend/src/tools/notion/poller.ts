import { resolveDecision, hasPendingDecisions, getStreamedResponseFullHistory } from "@backend/orchestration/orchestrator";
import { readPendingDecisions } from "./sections/decisions";
import { readPendingTasks, updateTaskStatus } from "./sections/tasks";
import { PermissionStatus } from "@openfiend/shared";
import { createTools } from "@backend/tools/tools";
import { v4 as uuidv4 } from "uuid";
import { db } from "@backend/db";
import { messages as messagesTable, conversations as conversationsTable, auditLogs as auditLogsTable } from "@backend/db/schema";
import WebSocket from "ws";

// infer the shape of a single decision from the array returned by readPendingDecisions
type NotionDecision = Awaited<ReturnType<typeof readPendingDecisions>>[number];

// messages the poller can broadcast to connected websocket clients
type BroadcastMessage =
    | { type: 'decision_approved'; decision: NotionDecision }
    | { type: 'decision_rejected'; decision: NotionDecision }
    | { type: string; [key: string]: unknown }

// callback signature for broadcasting to all connected clients (injected from index)
type BroadcastToClients = (message: BroadcastMessage) => void;

// returns a connected WS client (needed to create tools that can send permission requests)
type GetFirstClient = () => WebSocket | null;

// Polling interval in milliseconds
const POLL_INTERVAL_MS = 10000;
const TASK_POLL_INTERVAL_MS = 60000;

export function startNotionPolling(broadcastToClients: BroadcastToClients, getFirstClient: GetFirstClient): () => void {
    const statusCache = new Map<string, string>(); // pageId -> status
    let isRunning = true;
    let timeoutId: NodeJS.Timeout;
    let taskTimeoutId: NodeJS.Timeout;

    const poll = async (): Promise<void> => {
        if (!isRunning) return;

        try {
            // Short-circuit if there are no pending decisions to reduce unnecessary Notion API calls
            if (!hasPendingDecisions()) return;

            const decisions = await readPendingDecisions();

            for (const decision of decisions) {
                const { pageId, status: currentStatus } = decision;
                if (!pageId) continue;

                // Check if we've seen this decision before and if its status has changed
                const previousStatus = statusCache.get(pageId);
                statusCache.set(pageId, currentStatus);

                // First time seeing this decision  cache and skip
                if (!previousStatus) continue;

                if (previousStatus === 'pending_approval'
                    && (currentStatus === 'approved' || currentStatus === 'rejected')) {
                    const eventType = currentStatus === 'approved' ? 'decision_approved' : 'decision_rejected';

                    console.log(`[Notion Poller] Detected decision ${currentStatus} for pageId ${pageId}`);

                    resolveDecision(pageId, currentStatus === 'approved' ? PermissionStatus.Approved : PermissionStatus.Rejected);
                    broadcastToClients({ type: eventType, decision });
                }
            }
        } catch (error: any) {
            console.error(`[Notion Poller] Error during polling: ${error.message}`);
        } finally {
            // Schedule the next poll only if the poller is still running
            if (isRunning) timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
        }
    };

    const pollTasks = async (): Promise<void> => {
        if (!isRunning) return;
        const TASKS_PER_HOUR = 10; // adjust this based on expected task volume to balance responsiveness with API rate limits

        let nextPoll = TASK_POLL_INTERVAL_MS; // default to regular interval, but may adjust based on scheduled tasks
        let tasksCompletedThisHour = 0;
        let hourResetTime = Date.now() + 3600000; // reset the hourly counter after one hour

        if (Date.now() > hourResetTime) {
            tasksCompletedThisHour = 0;
            hourResetTime = Date.now() + 3600000;
        }

        if (tasksCompletedThisHour > TASKS_PER_HOUR) {
            console.log('[Notion Poller] Hourly task limit reached. Skipping');
            return;
        }

        try {
            const now = new Date();
            const allTasks = await readPendingTasks();

            // exclude tasks that are scheduled for the future (scheduledFor > now)
            const tasks = allTasks.filter(t => !t.scheduledFor || new Date(t.scheduledFor) <= now);

            const futureScheduled = allTasks
            .filter((t): t is typeof t & { scheduledFor: string } => !!t.scheduledFor && new Date(t.scheduledFor) > now)
            .map(t => new Date(t.scheduledFor).getTime() - now.getTime());


            nextPoll = futureScheduled.length > 0
                ? Math.max(1000, Math.min(TASK_POLL_INTERVAL_MS, ...futureScheduled))
                : TASK_POLL_INTERVAL_MS;

            if (tasks.length > 0) {
                // pick highest priority tasks (high > medium > low)
                const priorityOrder: Record<string, number> = { 'high': 0, 'medium': 1, 'low': 2 };
                tasks.sort((a,b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));
                const task = tasks[0];

                console.log(`[Notion Poller] Picked up task ${task.pageId} with priority ${task.priority}`);
                await updateTaskStatus(task.pageId, 'in_progress');

                // Process the task directly on the backend  no frontend round-trip
                const conversationId = uuidv4();
                                const taskContent = `[SYSTEM TASK] Handle this Notion task now.
                                    Task: ${task.description}
                                    Priority: ${task.priority}

                                    If the task is purely writing/thinking (draft, summarize, rewrite, brainstorm, explain), complete it directly and return the full output.
                                    If the task requires external actions/tools/permissions (send, delete, modify files, call APIs, purchases, bookings), do NOT execute it; instead return a one-sentence reminder.
                                    Keep responses concise and practical.`;



                // Create a conversation for this task
                db.insert(conversationsTable).values({
                    id: conversationId,
                    title: `Task: ${task.description.slice(0, 30)}`,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                }).run();

                // Save the task message
                db.insert(messagesTable).values({
                    id: uuidv4(),
                    conversationId,
                    role: 'user',
                    content: taskContent,
                    timestamp: Date.now(),
                }).run();

                // Broadcast the task as a user_input so frontends show it
                // broadcastToClients({
                //     type: 'user_input',
                //     content: taskContent,
                //     conversationId,
                // });

                // Get a WS client for tool creation (needed for permission requests)
                const wsClient = getFirstClient();
                if (!wsClient) {
                    console.warn('[Notion Poller] No connected WS client  processing task without permission tools');
                }

                // Create tools (pass a dummy WS if none connected  permission tools will fail gracefully)
                const tools = wsClient ? createTools(wsClient, conversationId) : {};

                try {
                    const response = await getStreamedResponseFullHistory(
                        [{ type: 'user_input', content: taskContent, conversationId }],
                        tools,
                    );

                    // Save response
                    db.insert(messagesTable).values({
                        id: uuidv4(),
                        conversationId,
                        role: 'assistant',
                        content: response.output,
                        timestamp: Date.now(),
                    }).run();

                    // Broadcast response to all connected frontends
                    broadcastToClients({
                        type: 'agent_response',
                        content: response.output,
                        conversationId,
                        steps: response.steps,
                    });

                    // Log audit entries
                    for (const step of response.steps) {
                        db.insert(auditLogsTable).values({
                            id: uuidv4(),
                            conversationId,
                            eventType: step.finishReason === 'tool-calls' ? 'tool-invocation' : 'llm-call',
                            input: JSON.stringify(step.stepContent.find(c => c.type === 'text')?.text || ''),
                            output: JSON.stringify(step.stepContent),
                            timestamp: Date.now(),
                        }).run();
                    }

                    // Mark task completed in Notion
                    await updateTaskStatus(task.pageId, 'completed', response.output);
                    console.log(`[Notion Poller] Task ${task.pageId} completed`);
                } catch (err: any) {
                    console.error(`[Notion Poller] Task ${task.pageId} failed:`, err.message);
                    await updateTaskStatus(task.pageId, 'failed', err.message).catch(() => {});
                }
            }
        } catch (error: any) {
            console.error(`[Notion Poller] Error during task polling: ${error.message}`);
        } finally {
            if (isRunning) taskTimeoutId = setTimeout(pollTasks, nextPoll);
        }
    };

    poll();
    pollTasks();

    // Return a cleanup function to stop polling when the server shuts down
    return () => {
        isRunning = false;
        clearTimeout(timeoutId);
        clearTimeout(taskTimeoutId);
    };
}


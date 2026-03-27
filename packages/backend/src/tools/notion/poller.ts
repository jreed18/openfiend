import { resolveDecision, hasPendingDecisions } from "@backend/orchestration/orchestrator";
import { readPendingDecisions } from "./sections/decisions";
import { PermissionStatus } from "@openfiend/shared";

// infer the shape of a single decision from the array returned by readPendingDecisions
type NotionDecision = Awaited<ReturnType<typeof readPendingDecisions>>[number];

// messages the poller can broadcast to connected websocket clients
type DecisionBroadcastMessage =
    | { type: 'decision_approved'; decision: NotionDecision }
    | { type: 'decision_rejected'; decision: NotionDecision }

// callback signature for broadcasting to all connected clients (injected from index)
type BroadcastToClients = (message: DecisionBroadcastMessage) => void;

// Polling interval in milliseconds
const POLL_INTERVAL_MS = 10000;

export function startNotionPolling(broadcastToClients: BroadcastToClients): () => void {
    const statusCache = new Map<string, string>(); // pageId -> status
    let isRunning = true;
    let timeoutId: NodeJS.Timeout;

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

                // First time seeing this decision — cache and skip
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

    poll();

    // Return a cleanup function to stop polling when the server shuts down
    return () => {
        isRunning = false;
        clearTimeout(timeoutId);
    };
}
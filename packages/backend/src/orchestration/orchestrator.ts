import '@backend/tools/tools';
import { anthropic } from '@ai-sdk/anthropic';
import { config } from 'dotenv';
import { groq } from '@ai-sdk/groq';
import { join } from 'node:path';
import { prompts } from './prompts';
import { ToolLoopAgent, type ToolSet } from 'ai';
import { writeDecision, updateDecisionStatus } from '@backend/tools/notion';
import { PermissionStatus } from '@openfiend/shared';
import type { WebSocket } from 'ws';

// a map to hold pending decisions awaiting user approval
const localPendingDecisionsMap = new Map<string, { resolve: (decision: PermissionStatus) => void }>();


export function resolveDecision(id: string, decision: PermissionStatus): void {
    const pending = localPendingDecisionsMap.get(id);
    if (!pending) {
        console.warn(`[Orchestrator] No pending decision found for ID: ${id}`);
        return;
    }
    console.log(`[Orchestrator] Resolving decision for ID ${id} with decision: ${decision}`);
    pending.resolve(decision);
    updateDecisionStatus(id, decision);
    localPendingDecisionsMap.delete(id);
}

export function hasPendingDecisions(): boolean {
    return localPendingDecisionsMap.size > 0;
}

export async function requestPermission(
    ws: WebSocket,
    data: { 
        toolName: string; 
        action: string; 
        reasoning: string;
        risks: string;
        annotations: string;
        riskLevel: 'low' | 'medium' | 'high'; 
        conversationId: string 
    }
): Promise<PermissionStatus> {
    try {
        // write decision to Notion with status 'pending_approval'
        const notionPageId = await writeDecision({
            action: data.action,
            reasoning: data.reasoning,
            riskLevel: data.riskLevel,
            risks: data.risks,
            conversationId: data.conversationId,
            status: 'pending_approval',
            annotation: data.annotations,
            timeStart: new Date().toISOString(),
            timeEnd: undefined,
            tool: data.toolName,
        });

        if (!notionPageId) {
            console.error('[Orchestrator] Failed to create Notion page for permission request');
            return PermissionStatus.Rejected; // default to rejecting if we can't log the request
        }

        // send permission_request message to frontend
        // matches the permission request in types.ts
        ws.send(JSON.stringify({
            type: 'permission_request',
            id: notionPageId,
            toolName: data.toolName,
            action: data.action,
            reasoning: data.reasoning,
            riskLevel: data.riskLevel,
            conversationId: data.conversationId,
        }));

        // return a promise that blocks until the user responds
        // resolveDecision() will call resolve() when frontend
        // sends back a permission_response message
        return new Promise<PermissionStatus>((resolve) => {
            localPendingDecisionsMap.set(notionPageId, { resolve: (decision) => {
                resolve(decision === 'approved' ? PermissionStatus.Approved : PermissionStatus.Rejected);
            } });
        });
    } catch (error: any) {
        console.error('[Orchestrator] Error requesting permission: ', error.message);
        return PermissionStatus.Rejected; // default to rejecting on error
    }
}

const envPath = join(import.meta.dirname, '../../../../.env.local');

config({ path: envPath });

const provider = process.env.LLM_PROVIDER;

interface ResponseFormat {
    output: string,
    steps: {
        stepNumber: number,
        stepContent: Array<{ type: string; text?: string }>,
        finishReason: string,
    }[]
}

export async function getStreamedResponse(prompt: string): Promise<ResponseFormat> {
    const agent = new ToolLoopAgent({
        model: provider === 'anthropic' ? anthropic('claude-haiku-4-5') : groq('llama-3.1-8b-instant'),
        instructions: `${prompts.system}\n\nCurrent time: ${new Date().toISOString()} (UTC). User's timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${new Date().getTimezoneOffset() <= 0 ? '+' : '-'}${Math.abs(new Date().getTimezoneOffset() / 60)}). Always schedule tasks in UTC.`,
        tools: {
            webSearch: anthropic.tools.webSearch_20250305(),
        }
    });

    const result = await agent.generate({
        prompt: prompt,
    });

    console.log(result);
    return {
        output: result.output,
        steps: result.steps.map(step => ({
            stepNumber: step.stepNumber,
            stepContent: step.content,
            finishReason: step.finishReason,
        }))
    }
}

export async function getStreamedResponseFullHistory(
  chatHistory: Array<{ type: string; content: string; conversationId: string }>,
  tools: ToolSet
): Promise<ResponseFormat> {
    const agent = new ToolLoopAgent({
        model: provider === 'anthropic' ? anthropic('claude-haiku-4-5') : groq('llama-3.1-8b-instant'),
        instructions: `${prompts.system}\n\nCurrent time: ${new Date().toISOString()} (UTC). User's timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${new Date().getTimezoneOffset() <= 0 ? '+' : '-'}${Math.abs(new Date().getTimezoneOffset() / 60)}). Always schedule tasks in UTC.`,
        tools: {
            ...tools,
        }
    });

    const result = await agent.generate({
        messages: chatHistory.map(msg => ({
            role: msg.type === 'user_input' ? 'user' as const : 'assistant' as const,
            content: msg.content,
        })),
    });

    return {
        output: result.output,
        steps: result.steps.map(step => ({
            stepNumber: step.stepNumber,
            stepContent: step.content,
            finishReason: step.finishReason,
        }))
    }
}

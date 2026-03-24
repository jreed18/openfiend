import { tool } from 'ai';
import { z } from 'zod';
import { prompts } from '@backend/orchestration/prompts';
import { requestPermission } from '@backend/orchestration/orchestrator';
import { WebSocket } from 'ws';

/**
 * V1 Tools Implementation Roadmap
 *
 * Core (V1):
 * - web_search: perform a web search
 * - run_shell: execute terminal command
 * - write_file: write a file on disk
 * - summarize_url: fetch and summarise any URL
 * - browser_control: plan-mode browser automation with screenshots
 * - spotify_control: play/pause/search Spotify tracks
 *
 * Stretch (V1.5+):
 * - slack_send: send Slack message
 * - whatsapp_send: send WhatsApp message
 * - telegram_send: send Telegram message
 * - email_read_and_summarize: read/summarize/phishing-check inbox
 * - email_draft_send: draft and send email
 * - current_news: get current headline news
 * - calendar_read: read calendar items
 * - calendar_create: create a calendar event
 * - monitor_network: watch network connections for anomalies
 * - watch_directories: watch sensitive dirs for changes
 */

export function createTools(ws: WebSocket, conversationId: string) {
    return {
        assessPermission: tool({
            description: 'Request user approval before taking a risky action. You MUST use this before executing shell commands, file writes or any destructive operation.',
            inputSchema: z.object({
                toolName: z.string().describe('The tool you want to use'),
                action: z.string().describe('What you intend to do, in plain English'),
                reasoning: z.string().describe('Why this action is necessary'),
                risks: z.string().describe('What could go wrong if this action fails or is misused'),
                annotations: z.string().describe('Any additional context or information for the user to consider when making their decision'),
                riskLevel: z.enum(['low', 'medium', 'high']).describe('Your assessment of the risk level'),
            }),
            async execute({ toolName, action, reasoning, risks, annotations, riskLevel }) {
                console.log(`Requesting permission to use tool: ${toolName}`);
                console.log(`Action: ${action}`);
                console.log(`Reasoning: ${reasoning}`);
                console.log(`Risks: ${risks}`);
                console.log(`Risk Level: ${riskLevel}`);
                return requestPermission(
                    ws,
                    {
                    toolName,
                    action,
                    reasoning,
                    risks,
                    annotations,
                    riskLevel,
                    conversationId,
                });
            }
        }),
        runShell: tool({
            description: 'Execute a shell command on the server. This is a powerful tool that can do anything from listing files to running scripts. ALWAYS use assessPermission before this tool.',
            inputSchema: z.object({
                command: z.string().describe('The shell command to execute, including any arguments. For example: "ls -la /home/user" or "python script.py --arg value"'),
            }),
            async execute({ command }) {
                const { exec } = await import('child_process');
                const { promisify } = await import('util');
                const execAsync = promisify(exec);

                try {
                    const { stdout, stderr } = await execAsync(command, {
                        encoding: 'utf-8',
                        timeout: 10000, // 10 second timeout to prevent hanging
                        maxBuffer: 1024 * 1024, // 1 MB max output to prevent memory issues
                    });
                    console.log(`Command output: ${stdout}`);
                    if (stderr) {
                        console.error(`Command error output: ${stderr}`);
                    }
                    return { success: true, output: stdout };
                } catch (error: any) {
                    console.error(`Error executing command: ${error.message}`);
                    return { success: false, error: error.message };
                }
            }
        })
    }
}

export const webSearch = tool({
    description: prompts.webSearch,
    inputSchema: z.object({
        query: z.string().describe('Search query string'),
        limit: z.number().optional().describe('Maximum number of search results to return'),
        endpoint: z.enum(['google', 'bing', 'duckduckgo']).default('google').describe('Search engine to use'),
    }),

    async execute({ query, limit = 5, endpoint }) {
        console.log(`Performing web search for: "${query}" using ${endpoint} (limit: ${limit})`);
    }
});
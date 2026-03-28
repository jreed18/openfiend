import { homedir } from 'os';
import { tool } from 'ai';
import { z } from 'zod';
import { prompts } from '@backend/orchestration/prompts';
import { WebSocket } from 'ws';
import { readRecentMemories, readRecentWill, writeMemory } from '@backend/tools/notion/sections/memory';
import { readRecentAutopsies } from '@backend/tools/notion/sections/autopsies'
import { scrapeUrl } from '@backend/tools/utils';
import { PermissionStatus } from '@openfiend/shared';
import { requestPermission } from '@backend/orchestration/orchestrator';
import { readPendingTasks, updateTaskStatus, writeTask } from '@backend/tools/notion/sections/tasks';


// 

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
            description: prompts.assessPermissionTool,
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
                const decision = await requestPermission(
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
                
                if (decision === PermissionStatus.Approved) {
                    return {
                        status: PermissionStatus.Approved,
                        toolName,
                        action,
                        instruction: `Permission APPROVED. You MUST now call the "${toolName}" tool to exexute "${action}". Do NOT tell the user you already did it - you have not yet performed the action.`
                    }
                }

                return {
                    status: PermissionStatus.Rejected,
                    toolName,
                    action,
                    instruction: `Permission REJECTED by the user. Do NOT proceed with: "${action}". Acknowledge the rejection and move on.`,
                }
            }
        }),
        runShell: tool({
            description: prompts.runShellTool,
            inputSchema: z.object({
                command: z.string().describe('The shell command to execute, including any arguments. For example: "ls -la /home/user" or "python script.py --arg value"'),
                cwd: z.string().optional().describe('The working directory to execute the command in. If not specified, defaults to the server\'s home directory. For example: "/home/user/projects"'),
            }),
            async execute({ command, cwd }) {
                const { exec } = await import('child_process');
                const { promisify } = await import('util');
                const execAsync = promisify(exec);

                try {
                    const { stdout, stderr } = await execAsync(command, {
                        encoding: 'utf-8',
                        cwd: cwd || homedir(),
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
        }),
        recall: tool({
            description: prompts.recallTool,
            inputSchema: z.object({
                query: z.string().optional().describe('Keyword to search for. Leave empty for most recent.'),
                source: z.enum(['memory', 'will', 'both']).default('both').describe('Which store to search.'),
                limit: z.number().optional().describe('How many results. Default 10.'),
            }),
            async execute({ query, source = 'both', limit = 10 }) {
                console.log(`I have no clue what you're saying, so let me see if I can remember.`);
                const results: any[] = [];
                if (source === 'memory' || source === 'both') {
                    const memories = await readRecentMemories(limit, query);
                    results.push(...memories.map(m => ({ ...m, source: 'memory' })));
                }
                if (source === 'will' || source === 'both') {
                    const will = await readRecentWill(limit, query);
                    results.push(...will.map(w => ({ content: w, source: 'will' })));
                }
                return { results, count: results.length };
            }
        }),
        remember: tool({
            description: prompts.rememberTool,
            inputSchema: z.object({
                content: z.string().describe('The content of the memory or will statement. Be clear and concise.'),
                type: z.enum(['memory', 'will']).describe('Whether this is a memory (something that happened) or a will statement (a principle or intention).'),
            }),
            async execute({ type, content }: { type: 'memory' | 'will'; content: string }) {
                console.log(`Remembering something new: ${content}`);
                const newMemory = await writeMemory({ type, content });
                if (!newMemory) {
                    console.error('Failed to write memory.');
                    return { success: false, error: 'Failed to write memory' };
                }
                console.log('Memory written with ID: ', newMemory);
                return {
                    success: true,
                    memoryId: newMemory,
                }
            }
        }),
        writeAutopsy: tool({
            description: prompts.writeAutopsyTool,
            inputSchema: z.object({
                whatHappened: z.string().describe('Describe the incident or failure in detail. What exactly went wrong?'),
                intent: z.string().describe('Describe the intent behind the actions that led to the incident. What were you trying to achieve?'),
                reality: z.string().describe('Describe the actual outcome and how it differed from the intended outcome. What happened instead?'),
                cause: z.string().describe('Analyze and describe the root cause of the incident. Why did it happen?'),
                learning: z.string().describe('Describe what you learned from this incident and how you will prevent it in the future. What changes will you make?'),
                severity: z.enum(['minor', 'significant', 'critical']).describe('Assess the severity of the incident based on its impact and consequences.'),
            }),
            async execute({ whatHappened, intent, reality, cause, learning, severity }) {
                console.log(`Writing autopsy report for incident: ${whatHappened}`);
                const { writeAutopsy } = await import('@backend/tools/notion/sections/autopsies');
                const result = await writeAutopsy({
                    whatHappened,
                    intent,
                    reality,
                    cause,
                    learning,
                    severity,
                });

                if (!result) {
                    console.error(`Failed to write autopsy report.`);
                    return { 
                        success: false, 
                        error: 'Failed to write autopsy report' };
                }

                console.log('Autopsy report written with ID: ', result);
                return {
                    success: true,
                    pageId: result,
                };
            }
        }),
        getAutopsy: tool({
            description: prompts.getAutopsyTool,
            inputSchema: z.object({
                limit: z.number().optional().describe('How many recent autopsy reports to retrieve. Default is 10.'),
            }),
            async execute({ limit = 10 }) {
                console.log(`Retrieving recent autopsy reports...`);
                const recentAutopsies = await readRecentAutopsies(limit);
                if (recentAutopsies.length === 0) {
                    console.error('[Notion] No recent autopsy reports found.');
                    return {
                        success: true,
                        autopsies: [],
                        error: 'No autopsy reports found.',
                    }
                }

                console.log(`[Notion] Found ${limit} recent autopsy reports.`);
                return {
                    success: true,
                    autopsies: recentAutopsies,
                    count: recentAutopsies.length,
                }
            }
        }),
        summarizeUrl: tool({
                description: prompts.summarizeUrlTool,
                inputSchema: z.object({
                    url: z.string().describe('The URL of the web page to summarize. For example: "https://en.wikipedia.org/wiki/OpenAI"'),
                }),
                async execute({ url }) {
                    try {
                        console.log(`Fetching and summarizing URL: ${url}`);
                        const result = await scrapeUrl(url);
                        if (!result.success) {
                            console.error(`Failed to summarize URL. Reason: ${result.error}`);
                            return {
                                success: false,
                                error: result.error,
                            }
                        }
                        return {
                            success: true,
                            title: result.title,
                            content: result.content,
                            byline: result.byline,
                        }
                    } catch (error: any) {
                        console.error(`URL summarizer failed. Reason: ${error.message}`);
                        return {
                            success: false,
                            error: error.message,
                        }
                    }
                }
        }),
        checkTasks: tool({
            description: prompts.checkTasksTool,
            inputSchema: z.object({}),
            async execute() {
                const pendingTasks = await readPendingTasks();
                return { tasks: pendingTasks, count: pendingTasks.length };
            }
        }),
        scheduleTask: tool({
            description: prompts.scheduleTaskTool,
            inputSchema: z.object({
                description: z.string().describe('A clear description of the task to be performed.'),
                priority: z.enum(['high', 'medium', 'low']).optional().describe('The priority of the task. Default is medium.'),
                scheduledFor: z.string().optional().describe('The date and time when the task is scheduled to be performed. Format: YYYY-MM-DDTHH:MM:SSZ'),
            }),
            async execute({ description, priority = 'medium', scheduledFor }) {
                try {
                    const task = await writeTask({
                        description,
                        priority,
                        status: 'pending',
                        scheduledFor,
                    });
                    return { success: true, task };
                } catch (error: any) {
                    console.error(`Failed to schedule task. Reason: ${error.message}`);
                    return { success: false, error: error.message };
                }
            }
        }),
        completeTask: tool({
            description: prompts.completeTaskTool,
            inputSchema: z.object({
                pageId: z.string().describe('The Notion page ID of the task to mark as completed.'),
                status: z.enum(['completed', 'failed']).describe('Whether the task was completed successfully or failed.'),
                result: z.string().optional().describe('Any additional notes or results to record about the task completion.'),
            }),
            async execute({ pageId, status, result }) {
                try {
                    const success = await updateTaskStatus(pageId, status, result);
                    return { success, pageId, status };
                } catch (error: any) {
                    console.error(`Failed to complete task. Reason: ${error.message}`);
                    return { success: false, error: error.message };
                }
            }
        })
    }
}

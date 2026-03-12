import { tool } from 'ai';
import { z } from 'zod';
import { prompts } from '@backend/orchestration/prompts';

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
})
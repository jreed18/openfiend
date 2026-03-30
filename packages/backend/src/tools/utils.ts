import { JSDOM } from 'jsdom';
import fetch from 'node-fetch'
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

export interface ScrapeResult {
    success: boolean;
    title?: string;
    content?: string;
    byline?: string | null;
    error?: string;
}

export async function scrapeUrl(url: string, contentLength: number = 3000): Promise<ScrapeResult> {
    try {
        const result = await fetch(url);
        if (!result.ok) {
            return {
                success: false,
                error: `HTTP ${result.status}: ${result.statusText}`
            };
        }

        const html = await result.text();
        const dom = new JSDOM(html, { url });
        const article = new Readability(dom.window.document).parse();

        if (!article) {
            return {
                success: false,
                error: 'Could not extract content from the URL.',
            };
        }

        const turndown = new TurndownService();
        const markdown = turndown.turndown(article.content || '');

        return {
            success: true,
            title: article.title || 'Untitled',
            content: markdown.slice(0, contentLength),
            byline: article?.byline || null,
        }

    } catch (error: any) {
        console.error(`Error scraping URL: ${error.message}`);
        return {
            success: false,
            error: error.message,
        }
    }
}
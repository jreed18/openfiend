import { streamText } from 'ai';
import { config } from 'dotenv';
import { join } from 'node:path';
import { anthropic } from '@ai-sdk/anthropic';

// Native Node.js properties (no setup required)
const envPath = join(import.meta.dirname, '../../../.env.local');

config({ path: envPath });

async function main() {
    
    const result = await streamText({
        model: anthropic('claude-haiku-4-5-20251001'),
        prompt: `You're a random dad joke generator. Give me your best one`,
    });

    for await (const textPart of result.textStream) {
        process.stdout.write(textPart);
    }

    console.log();
    console.log(`Token usage: ${await result.usage}`);
    console.log(`Finish reason: ${await result.finishReason}`);
}

main().catch(console.error);
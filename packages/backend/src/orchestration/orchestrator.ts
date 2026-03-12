import { config } from 'dotenv';
import { join } from 'node:path';
import { ToolLoopAgent } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { prompts } from './prompts';
import '@backend/tools/tools';

const envPath = join(import.meta.dirname, '../../../../.env.local');

config({ path: envPath });

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
        model: anthropic('claude-haiku-4-5'),
        instructions: prompts.system,
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
  chatHistory: Array<{ type: string; content: string; conversationId: string }>
): Promise<ResponseFormat> {
    const agent = new ToolLoopAgent({
        model: anthropic('claude-haiku-4-5'),
        instructions: prompts.system,
        tools: {
            webSearch: anthropic.tools.webSearch_20250305(),
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

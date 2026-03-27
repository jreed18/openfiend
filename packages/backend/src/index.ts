import express from 'express';
import expressWs from 'express-ws';
import { z } from 'zod';
import { getStreamedResponseFullHistory, resolveDecision } from './orchestration/orchestrator';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { messages as messagesTable, 
  conversations as conversationsTable, 
  auditLogs as auditLogsTable } from './db/schema';
import { eq } from 'drizzle-orm';
import { PermissionStatus } from '@openfiend/shared';
import { createTools } from './tools/tools';
import { initializeNotionWorkspace } from './tools/notion';
import WebSocket from 'ws';
import { startNotionPolling } from './tools/notion/poller';

const app = express();

const wsInstance = expressWs(app);
const wsApp = wsInstance.app;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3737;

// Message schema - will match the frontend
const UserInputSchema = z.object({
  type: z.literal('user_input'),
  content: z.string(),
  conversationId: z.string(),
})

// Middleware
app.use(express.json());

// serve frontend static files
const frontendDistDir = path.join(__dirname, '../../frontend/dist');

app.use(express.static(frontendDistDir));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

// WebSocket endpoint for agent communication
wsApp.ws('/ws', (ws, _req) => {
  console.log('WebSocket client connected');

  const provider = process.env.LLM_PROVIDER || 'anthropic';
  const model = provider === 'anthropic' ? 'claude-haiku-4-5' : 'groq-llama-3.1-8b-instant';

  // send system info message to frontend so it knows which model/provider we're using
  ws.send(JSON.stringify({
    type: 'system_info',
    model,
    provider,
   }));

  ws.on('message', async (msg) => {
    console.log('Received message:', msg);
    try {
      const raw = JSON.parse(msg.toString());

      if (raw.type === 'permission_response') {
        // validate with PermissionResponseSchema (or inline z.object parse)
        const PermissionResponseSchema = z.object({
          type: z.literal('permission_response'),
          id: z.string(),
          decision: z.enum(['approved', 'rejected']),
          conversationId: z.string(),
        });

        const parsedResponse = PermissionResponseSchema.parse(raw);
        // call resolveDecision(parsedResponse.id, parsedResponse.decision)
        console.log(`Received permission response for ID ${parsedResponse.id}: ${parsedResponse.decision}`);
        resolveDecision(parsedResponse.id, parsedResponse.decision as PermissionStatus);
        console.log(`Permission decision resolved for ID ${parsedResponse.id}`);
        return; // return early (don't send to LLM)
      }

      const parsedMessage = UserInputSchema.parse(JSON.parse(msg.toString()));

      // TODO: Create context for LLM based on conversationId.
      const conversationId = parsedMessage.conversationId;

      const existingConversation = db.select().from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId))
      .get();

      if (!existingConversation) {
        db.insert(conversationsTable).values({
          id: conversationId,
          title: parsedMessage.content.slice(0,40),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }).run();
      }

      db.insert(messagesTable).values({
        id: uuidv4(),
        conversationId: conversationId,
        role: 'user',
        content: parsedMessage.content,
        timestamp: Date.now(),
      }).run();

      // Load history
      const history = db.select().from(messagesTable)
      .where(eq(messagesTable.conversationId, conversationId))
      .all()
      .map(msg => ({
        type: msg.role === 'user' ? ('user_input' as const) : ('agent_response' as const),
        content: msg.content,
        conversationId: conversationId,
      }))

      // Echo user input back so frontend displays it
      ws.send(JSON.stringify({
        type: 'user_input',
        content: parsedMessage.content,
        conversationId: conversationId,
      }));

      const tools = createTools(ws, conversationId);

      const response = await getStreamedResponseFullHistory(
        history.filter(msg => 'content' in msg),
        tools
      );

      // add response to history
      db.insert(messagesTable).values({
        id: uuidv4(),
        conversationId: conversationId,
        role: 'assistant',
        content: response.output,
        timestamp: Date.now(),
      }).run();

      ws.send(JSON.stringify({
        type: 'agent_response',
        content: response.output,
        conversationId: conversationId,
        steps: response.steps,
      }));

      for (const step of response.steps) {
        db.insert(auditLogsTable).values({
          id: uuidv4(),
          conversationId: conversationId,
          eventType: step.finishReason === 'tool-calls' ? 'tool-invocation' : 'llm-call',
          input: JSON.stringify(step.stepContent.find(c => c.type === 'text')?.text || ''),
          output: JSON.stringify(step.stepContent),
          timestamp: Date.now(),
        }).run();

        ws.send(JSON.stringify({
          type: 'audit_log',
          entry: {
            id: uuidv4(),
            timestamp: Date.now(),
            eventType: step.finishReason === 'tool-calls' ? 'tool-invocation': 'llm-call',
            conversationId,
            input: JSON.stringify(step.stepContent.find(c => c.type === 'text')?.text || ''),
            output: JSON.stringify(step.stepContent),
          }
        }));
      }
    } catch (error) {
        console.error(`Error: ${error}`);
        ws.send(JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        }))
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Create GET route for messages in a conversation
app.get('/api/conversations/:id/messages', (req, res) => {
  console.log(`[API] GET /api/conversations/${req.params.id}/messages`);
  const messages = db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, req.params.id))
    .all();
  console.log(`[API] Returning ${messages.length} messages`);
  res.json(messages);
});

// SPA fallback — serve index.html for all non-API routes
app.use((_req, res) => {
  res.sendFile(path.join(frontendDistDir, 'index.html'));
});

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message });
});

// broadcast helper
const broadcastToClients = (message: unknown) => {
  const payload = JSON.stringify(message);
  const wss = wsInstance.getWss();

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// Start server
try {
  wsApp.listen(PORT, () => {
    console.log(`OPENFIEND backend running on http://localhost:${PORT}`);

    // initialize notion integration - this acts as Bob's persistent memory and ethical judgement
    console.log(`[Notion] Initializing Bob's brain structure...`);
    initializeNotionWorkspace();
    startNotionPolling(broadcastToClients);
    console.log(`[Notion] Initialization complete. Started polling for decision updates.`);
  });
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}

// Catch unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

import express from 'express';
import expressWs from 'express-ws';
import { z } from 'zod';
import { getStreamedResponse, getStreamedResponseFullHistory } from './orchestration/orchestrator';
import { Message } from '@openfiend/shared';

const app = express();
const wsApp = expressWs(app).app;
const conversations = new Map<string, Message[]>();

const PORT = process.env.PORT || 3737;

// Message schema - will match the frontend
const UserInputSchema = z.object({
  type: z.literal('user_input'),
  content: z.string(),
  conversationId: z.string(),
})

// Middleware
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

// WebSocket endpoint for agent communication
wsApp.ws('/ws', (ws, _req) => {
  console.log('WebSocket client connected');

  ws.on('message', async (msg) => {
    console.log('Received message:', msg);
    try {
      const parsedMessage = UserInputSchema.parse(JSON.parse(msg.toString()));

      // TODO: Create context for LLM based on conversationId.
      const conversationId = parsedMessage.conversationId;

      if (!conversations.has(conversationId)) {
        conversations.set(conversationId, []);
      }

      const history = conversations.get(conversationId)!;
      history.push({
        type: 'user_input',
        content: parsedMessage.content,
        conversationId: conversationId,
      })

      // Echo user input back so frontend displays it
      ws.send(JSON.stringify({
        type: 'user_input',
        content: parsedMessage.content,
        conversationId: conversationId,
      }));

      const response = await getStreamedResponseFullHistory(
        history.filter(msg => 'content' in msg)
      );

      // add response to history
      history?.push({
        type: 'agent_response',
        content: response.output,
        conversationId: conversationId,
      })

      ws.send(JSON.stringify({
        type: 'agent_response',
        content: response.output,
        conversationId: conversationId,
        steps: response.steps,
      }));
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

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message });
});

// Start server
try {
  wsApp.listen(PORT, () => {
    console.log(`OPENFIEND backend running on http://localhost:${PORT}`);
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

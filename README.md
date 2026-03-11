# OPENFIEND

**Open-source AI agent platform with security you can actually see.**

Every action visible. Every permission explicit. No black boxes.

## What is this?

OpenFiend is a security-first AI agent platform. The first agent — Bob — is a paranoid, audit-log-obsessed assistant powered by Claude. You talk to Bob through a real-time chat interface, and everything he does is logged and visible.

This is v0.1. It's early, it's messy, and it works.

## Quick Start

```bash
pnpm install
pnpm dev
```

Frontend: `localhost:5173` | Backend: `localhost:3737`

You'll need an `ANTHROPIC_API_KEY` in `.env.local` at the project root.

## Architecture

```
openfiend/
├── packages/
│   ├── backend/        # Node.js + Express + WebSocket server
│   ├── frontend/       # React + Tailwind CSS (dark theme)
│   └── shared/         # Shared types & Zod schemas
├── ecosystem.config.js # PM2 daemon config
└── package.json        # pnpm workspace root
```

**Stack:**
- React + TypeScript + Tailwind CSS (frontend)
- Node.js + Express + express-ws (backend)
- Vercel AI SDK + Claude (agent)
- WebSocket (real-time communication)
- Zod (message validation)

## What works now (v0.1)

- Real-time chat with Bob via WebSocket
- Conversational context (Bob remembers what you said)
- Web search tool (Bob can look things up)
- 3-panel layout (left rail, chat, audit trail)
- Themed UI (magenta + orange on black)

## What's coming (v1)

- **Audit trail** — live timeline of every LLM call, tool use, and permission request in the right panel
- **Streaming responses** — word-by-word response rendering
- **Permission system** — explicit approval dialogs before sensitive actions
- **SQLite persistence** — conversation history and audit logs saved to disk
- **More tools** — Playwright (web browsing), code execution, file operations
- **Skill system** — sandboxed, manifest-based plugins

## Security Philosophy

1. **Visible** — Every agent action logged and displayed
2. **Explicit** — Permissions require user approval
3. **Sandboxed** — Skills run isolated with declared capabilities only
4. **Open** — Source code public from day one

## Requirements

- Node.js 22+
- pnpm 9+

## License

TBD

## Credits

Built by Jonah Reed.

openfiend.com

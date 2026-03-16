<div align="center">

# `O P E N F I E N D`

### **NO BLACK BOXES. NO TRUST REQUIRED.**

[![v0.1](https://img.shields.io/badge/version-0.1-e11d7e?style=flat-square&labelColor=0a0a0a)](https://github.com/jreed18/openfiend)
[![License](https://img.shields.io/badge/license-TBD-f97316?style=flat-square&labelColor=0a0a0a)](.)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-e11d7e?style=flat-square&labelColor=0a0a0a)](.)
[![Open Source](https://img.shields.io/badge/open_source-day_one-f97316?style=flat-square&labelColor=0a0a0a)](.)

---

**Security-first AI agent platform.**<br>
**Every action visible. Every permission explicit. Everything auditable.**

</div>

---

<br>

## `> WHAT IS THIS`

OpenFiend is an AI agent platform where **transparency isn't a feature — it's the architecture.**

The first agent — **Bob** — is a paranoid, audit-log-obsessed assistant powered by Claude. You talk to Bob through a real-time WebSocket chat interface. Everything he does is logged, visible, and controllable.

```
This is v0.1. It's early and messy, but we're (I'm) making it work!
```

<br>

## `> QUICK START`

```bash
git clone https://github.com/jreed18/openfiend.git
cd openfiend
cp .env.example .env.local    # add your API keys (see .env.example)
pnpm install
pnpm dev
```

| Service | URL |
|:--|:--|
| **Frontend** | `localhost:5173` |
| **Backend** | `localhost:3737` |
| **WebSocket** | `ws://localhost:3737/ws` |

> Requires **Node.js 22+** and **pnpm 9+**

<br>

## `> ARCHITECTURE`

```
┌──────────────────────────────────────────────────────────────┐
│                        OPENFIEND                             │
├──────────────┬────────────────────────┬──────────────────────┤
│  LEFT RAIL   │     CENTER PANEL       │    RIGHT PANEL       │
│              │                        │                       │
│  conversation│     real-time chat     │    audit trail        │
│  history     │     with agent         │    every. single.     │
│              │                        │    action.            │
│              │                        │                       │
│              │                        │    ▸ llm_call         │
│              │                        │    ▸ tool_invocation  │
│              │                        │    ▸ permission_req   │
├──────────────┴────────────────────────┴──────────────────────┤
│                     WebSocket (ws://)                         │
├──────────────────────────────────────────────────────────────┤
│              Node.js + Express + Vercel AI SDK               │
└──────────────────────────────────────────────────────────────┘
```

```
openfiend/
├── packages/
│   ├── backend/     # Node.js + Express + WebSocket
│   ├── frontend/    # React + Tailwind (dark theme)
│   └── shared/      # Zod schemas + shared types
├── ecosystem.config.js
└── pnpm-workspace.yaml
```

<br>

## `> THE STACK`

| Layer | Tech |
|:--|:--|
| **Agent** | Vercel AI SDK (Anthropic + Groq) |
| **Database** | SQLite + Drizzle ORM |
| **Frontend** | React + TypeScript + Tailwind CSS |
| **Backend** | Node.js + Express + express-ws |
| **Protocol** | WebSocket (real-time, bidirectional) |
| **Validation** | Zod (every message, both sides) |
| **Design** | Brutalist dark — `#e11d7e` magenta / `#f97316` orange / `#0a0a0a` black |

<br>

## `> WHAT WORKS (v0.1)`

- [x] Real-time chat with Bob via WebSocket
- [x] Conversational context — Bob remembers what you said
- [x] SQLite persistence — conversations saved to disk via Drizzle ORM
- [x] Basic audit trail — agent actions logged to the right panel
- [x] 3-panel layout (history / chat / audit)
- [x] Themed UI (magenta + orange on black)
- [x] Zod-validated message protocol

<br>

## `> WHAT'S COMING`

- [ ] **Streaming** — word-by-word response rendering
- [ ] **Richer audit trail** — tool invocations, permission decisions, full event timeline
- [ ] **Permission system** — explicit approval dialogs before sensitive actions
- [ ] **More tools** — Playwright, code execution, file operations
- [ ] **Skill system** — sandboxed, manifest-based plugins

<br>

## `> SECURITY PHILOSOPHY`

```
 ╔═══════════════════════════════════════════════════╗
 ║                                                   ║
 ║   1. VISIBLE    — every agent action is logged    ║
 ║   2. EXPLICIT   — permissions require approval    ║
 ║   3. SANDBOXED  — skills run isolated             ║
 ║   4. OPEN       — source code public, day one     ║
 ║                                                   ║
 ╚═══════════════════════════════════════════════════╝
```

Most AI agents ask you to trust them. OpenFiend asks you to **watch.**

<br>

## `> CONTRIBUTING`

This is early. Very very early. Contributions aren't open yet — but if you're into transparent AI agents and want to follow along, [star the repo](https://github.com/jreed18/openfiend) and watch for updates. When v1 lands, [issues](https://github.com/jreed18/openfiend/issues) will be the place to jump in.

<br>

---

<div align="center">

**Built by [Jonah Reed](https://github.com/jreed18)**

[`openfiend.com`](https://openfiend.com/)

<br>

```
"I logged that you read this README btw" — Bob (probably)
```

</div>

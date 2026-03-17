# Borg

> Local AI operations control plane for MCP routing, provider fallback, session supervision, and a unified dashboard.

Borg is being stabilized toward a focused `1.0` release around four core capabilities:


## Current status

This repository is in an active cleanup and stabilization phase.


**[Early release — actively developed. Feedback and PRs welcome.]**

---

## The problem

Running multiple AI tools locally is messy:

- Each tool maintains its own MCP server config — five tools, five separate lists to keep in sync
- When OpenAI rate-limits your session mid-task, everything stops
- Long-running agent sessions (Claude Code, OpenCode, Jules, etc.) have no central oversight
- There's no single place to see what's running, what's broken, or what it's costing

Borg is the layer that sits between your AI tools and their infrastructure.

## What it does

| Feature | Description |
|---|---|
| **MCP Master Router** | Aggregate any number of MCP servers behind one endpoint. Every tool that speaks MCP connects here instead of maintaining separate configs. |
| **Provider Fallback** | Define a priority chain — OpenAI → Claude → Gemini → local Ollama. When a quota runs out or a rate-limit hits, the next provider takes over automatically. |
| **Session Supervisor** | Attach to external coding agent sessions (Claude Code, OpenCode, Jules). Monitor status, send broadcast messages, detect failures. |
| **Web Dashboard** | One URL for everything — system health, MCP server status, active sessions, provider billing, config. |
| **Browser Extension** | Chrome/Firefox side-panel that surfaces Borg context inside any AI web app. |

---

## Quick start

### Prerequisites

- Node.js 20+
- `pnpm` 10+
- Docker Desktop (optional — only needed for the containerized stack)

### Option A — Docker Compose (recommended for first run)

```bash
git clone https://github.com/robertpelloni/borg.git
cd borg
docker compose up --build
```

Once running:

- Dashboard: `http://localhost:3001/dashboard`
- Core API: `http://localhost:3000`
- MCP router: `http://localhost:3001/dashboard/mcp`

> The first build takes several minutes — it compiles the monorepo and the Next.js dashboard inside Docker.

**Windows note:** If you see `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`, Docker Desktop isn't running yet. Start it and retry.

### Option B — Local development

```bash
git clone https://github.com/robertpelloni/borg.git
cd borg
pnpm install
pnpm run dev
```

The launcher starts the core bridge, waits for the readiness contract, builds browser-extension artifacts if missing, and prints the active dashboard URL. Usually `http://127.0.0.1:3000/dashboard` — falls back to `3010`, `3020`, etc. if `3000` is occupied.

Verify all services are up:

```bash
node scripts/verify_dev_readiness.mjs
```

---

## Configuration

```bash
cp apps/web/.env.example apps/web/.env.local
cp packages/core/.env.example packages/core/.env
```

Fill in at least one provider key. Borg degrades gracefully when providers are missing — it skips them in the fallback chain.

```env
OPENROUTER_API_KEY=...   # recommended — access to all major providers via one key
ANTHROPIC_API_KEY=...    # optional
OPENAI_API_KEY=...       # optional
GOOGLE_API_KEY=...       # optional
```

MCP server config lives in `mcp.json` at the repo root — standard MCP client config format. Point any MCP-compatible client at this file.

---

## Dashboard routes

| Path | Purpose |
|---|---|
| `/dashboard` | Mission Control — live system health |
| `/dashboard/mcp` | MCP router — servers, tools, namespaces, routing config |
| `/dashboard/sessions` | Session supervisor — agent sessions, logs, broadcast |
| `/dashboard/billing` | Provider status, quota, fallback chain config |
| `/dashboard/config` | Platform settings |

---

## Repository layout

```text
borg/
├── apps/web/              # Next.js dashboard (tRPC + React)
├── apps/borg-extension/   # Browser extension (Chrome/Edge + Firefox)
├── packages/core/         # MCP routing, orchestration, provider services
├── packages/cli/          # CLI entrypoint
├── packages/ui/           # Shared component library
├── packages/types/        # Shared types/schemas
├── packages/memory/       # Vector memory (LanceDB) integration
├── tasks/                 # Active, backlog, completed task briefs
├── docs/                  # Architecture docs and planning material
└── docker-compose.yml     # Containerized local stack
```

---

## Debug logging

```bash
# Verbose MCP server startup diagnostics
BORG_MCP_SERVER_DEBUG=1 pnpm run dev

# PowerShell
$env:BORG_MCP_SERVER_DEBUG='1'; pnpm run dev
```

---

## Docs

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — high-level system design
- [`ROADMAP.md`](ROADMAP.md) — current 1.0 / 1.5 / 2.0 milestones
- [`CHANGELOG.md`](CHANGELOG.md) — release history
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — how to contribute

---

## Contributing

Open an issue or PR. Keep changes focused on the four core workflows (MCP routing, provider fallback, session supervision, dashboard). See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## License

MIT

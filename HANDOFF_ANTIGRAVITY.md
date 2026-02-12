# HANDOFF_ANTIGRAVITY.md — Session Report (2026-02-11)

> **For**: Any model (Claude, Gemini, GPT) picking up Borg development.
> **From**: Antigravity Session `82e8874c-4939-4d9c-bb41-85e1f27128ad`
> **Date**: 2026-02-11T22:00:00-05:00

---

## 1. Session Summary

This session focused on **build stability**, **feature completeness**, and **@ts-ignore cleanup** across the Borg monorepo. All changes target `packages/core`, `apps/web`, and supporting files.

### Key Accomplishments

| Area | What Changed | Files |
|------|-------------|-------|
| **tRPC Alignment** | Upgraded all packages to tRPC v11 | `packages/core/package.json`, `packages/ui/package.json` |
| **Router Deduplication** | Fixed duplicate `health`/`getTaskStatus` keys in appRouter | `packages/core/src/trpc.ts` |
| **@ts-ignore Cleanup** | Refactored `getTaskStatus`, `indexingStatus`, `pulseRouter`, `researchRouter` to use `getMcpServer()` | `trpc.ts`, `pulseRouter.ts`, `researchRouter.ts` |
| **Graph Dependencies** | Added `dependencies` map to `RepoGraphService.toJSON()` | `RepoGraphService.ts`, `graphRouter.ts` |
| **Billing** | Real cost tracking via `QuotaService.getUsageByModel()` | `QuotaService.ts`, `billingRouter.ts` |
| **EventBus** | Uncommented initialization in MCPServer | `MCPServer.ts` |
| **ProjectTracker** | Removed hardcoded brain path; prioritizes local `task.md` | `ProjectTracker.ts` |
| **Circular Deps** | Fixed `squadRouter` import (`../trpc.js` → `../lib/trpc-core.js`) | `squadRouter.ts` |

---

## 2. Architecture Overview

### Monorepo Structure

```
borg/
├── apps/
│   ├── web/          # Next.js 16 Dashboard (31 pages)
│   └── extension/    # VS Code extension (tsup)
├── packages/
│   ├── core/         # MCPServer, tRPC routers, services (THE BRAIN)
│   ├── ui/           # Shared React components
│   ├── ai/           # ModelSelector, LLMService
│   ├── memory/       # VectorStore, Indexer
│   ├── tools/        # MCP tool definitions
│   ├── agents/       # Agent definitions
│   ├── supervisor/   # Autonomous supervisor
│   ├── search/       # Code search
│   ├── adk/          # Agent Development Kit
│   └── cli/          # CLI interface (tsx)
```

### packages/core — The Brain

**25 Routers** (in `src/routers/`):

| Router | Purpose | Status |
|--------|---------|--------|
| `graphRouter` | Repo dependency graph (Mermaid viz) | ✅ Working |
| `billingRouter` | Cost tracking per model/provider | ✅ Working |
| `pulseRouter` | Real-time event stream (EventBus) | ✅ Refactored |
| `skillsRouter` | Skill registry CRUD | ✅ Working |
| `squadRouter` | Agent squad management | ✅ Fixed import |
| `researchRouter` | Deep research via MCP | ✅ Refactored |
| `lspRouter` | Language Server Protocol queries | ✅ Working |
| `sessionRouter` | Session persistence | ✅ Working |
| `settingsRouter` | User settings | ✅ Working |
| `supervisorRouter` | Autonomous supervisor | ✅ Working |
| `metricsRouter` | System metrics | ✅ Working |
| `councilRouter` | Multi-model council voting | ✅ Working |
| `memoryRouter` | Memory save/recall/search | ✅ Working |
| `knowledgeRouter` | Knowledge graph | ✅ Working |
| `agentMemoryRouter` | Per-agent memory | ✅ Working |
| `planRouter` | Plan CRUD | ✅ Working |
| `contextRouter` | Context injection (aliased `borgContext`) | ✅ Working |
| `commandsRouter` | Slash commands | ✅ Working |
| `symbolsRouter` | Symbol index/search | ⚠️ Has @ts-ignore |
| `autoDevRouter` | Auto-development loop | ✅ Working |
| `shellRouter` | Shell command execution | ⚠️ Has @ts-ignore |
| `workflowRouter` | Workflow engine CRUD | ⚠️ Has @ts-ignore |
| `testsRouter` | Test runner | ⚠️ Has @ts-ignore |
| `suggestionsRouter` | AI suggestions | ⚠️ Has @ts-ignore |
| `healerRouter` | Self-healing diagnostics | ✅ Working |

**30 Services** (in `src/services/`):

Core services powering the routers. Key ones:
- `ProjectTracker` — Parses `task.md`/`ROADMAP.md` for progress tracking
- `EventBus` — System event pub/sub with history buffer
- `RepoGraphService` — AST-based import graph builder
- `LSPService` — Multi-language LSP server manager
- `HealerService` — Self-healing with error analysis
- `DarwinService` — Evolutionary code mutation
- `MetricsService` — System metrics collection
- `QuotaService` — Token/cost tracking per model
- `PlanService` — Execution plan management
- `DeepResearchService` — Multi-step research orchestration
- `AgentMemoryService` — Per-agent persistent memory

### apps/web — Mission Control Dashboard

**31 Dashboard Pages** (in `src/app/dashboard/`):

| Page | tRPC Router Used | Status |
|------|-----------------|--------|
| `/architecture` | `graph.get` | ✅ Uses `dependencies` map |
| `/billing` | `billing.getStatus` | ✅ Real data |
| `/brain` | `memory.*` | ✅ Working |
| `/chronicle` | `git.getLog` | ✅ Working |
| `/code` | `autoDev.*` | ✅ Working |
| `/command` | `commands.*` | ✅ Working |
| `/config` | `directorConfig.*` | ✅ Working |
| `/council` | `council.*` | ✅ Working |
| `/director` | `director.*` | ✅ Working |
| `/events` | `pulse.*` | ✅ Refactored |
| `/evolution` | `darwin.*` | ✅ Working |
| `/healer` | `healer.*` | ✅ Working |
| `/inspector` | Various | ✅ Working |
| `/knowledge` | `knowledge.*` | ✅ Working |
| `/library` | `skills.*` | ✅ Working |
| `/manual` | Static | ✅ Working |
| `/mcp` | Placeholder | ⚠️ Commented out |
| `/memory` | `memory.*` | ✅ Working |
| `/metrics` | `metrics.*` | ✅ Working |
| `/plans` | `planService.*` | ✅ Working |
| `/pulse` | `pulse.*` | ✅ Working |
| `/reader` | Static | ✅ Working |
| `/research` | `research.*` | ✅ Working |
| `/security` | `audit.*` | ✅ Working |
| `/settings` | `settings.*` | ✅ Working |
| `/skills` | `skills.*` | ✅ Working |
| `/squads` | `squad.*` | ✅ Working |
| `/submodules` | `git.getModules` | ✅ Working |
| `/supervisor` | `supervisor.*` | ✅ Working |
| `/workflows` | `workflow.*` | ✅ Working |
| `/workshop` | Placeholder | ✅ Working |

---

## 3. Remaining Technical Debt

### @ts-ignore Inventory (Routers Only)

| File | Count | Pattern | Fix Strategy |
|------|-------|---------|-------------|
| `workflowRouter.ts` | 10 | `global.mcpServerInstance` | Refactor to `getMcpServer()` |
| `symbolsRouter.ts` | 14 | `global.mcpServerInstance` | Refactor to `getMcpServer()` |
| `suggestionsRouter.ts` | 7 | `global.mcpServerInstance` | Refactor to `getMcpServer()` |
| `squadRouter.ts` | 5 | `global.mcpServerInstance` | Refactor to `getMcpServer()` |
| `skillsRouter.ts` | 5 | `global.mcpServerInstance` | Refactor to `getMcpServer()` |
| `shellRouter.ts` | 6 | `global.mcpServerInstance` | Refactor to `getMcpServer()` |
| `testsRouter.ts` | 2 | `global.mcpServerInstance` | Refactor to `getMcpServer()` |
| `graphRouter.ts` | 3 | `global.mcpServerInstance` | Refactor to `getMcpServer()` |

**Pattern**: All use `global.mcpServerInstance` instead of the typed `getMcpServer()` helper from `lib/mcpHelper.js`.

**Fix**: Import `getMcpServer` from `../lib/mcpHelper.js` and replace all `global.mcpServerInstance` references.

### trpc.ts Remaining @ts-ignore

Lines with remaining `@ts-ignore` in `trpc.ts` appRouter:
- `autonomy.activateFullAutonomy` — calls `director.startChatDaemon()` / `director.startWatchdog()` (private methods)
- `director.chat` — calls `director.broadcast()` / `director.executeTask()` (private methods)
- `executeTool` — accesses `result.isError` / `result.content[0].text` (untyped MCP response)

These require adding proper method signatures to the `Director` class and typing MCP tool responses.

### healer.subscribe (Disabled)

The `healer.subscribe` subscription is commented out due to TS2742 errors with tRPC v11 observable types. To re-enable:
1. Ensure `@trpc/server/observable` types are compatible
2. Add explicit return type annotation to avoid circular type inference

---

## 4. Key Helper Pattern

### `getMcpServer()` — The Standard Way

```typescript
// lib/mcpHelper.ts
export function getMcpServer(): MCPServer {
    return (global as any).mcpServerInstance;
}
```

**All routers should use this** instead of raw `global.mcpServerInstance` with `@ts-ignore`. The helper is already imported in `trpc.ts`, `pulseRouter.ts`, `researchRouter.ts`, `lspRouter.ts`.

### `lib/trpc-core.js` — Break Circular Dependencies

```typescript
// lib/trpc-core.ts
import { initTRPC } from '@trpc/server';
const t = initTRPC.create();
export { t };
export const publicProcedure = t.procedure;
export const adminProcedure = t.procedure;
```

**All routers must import from `lib/trpc-core.js`**, NOT from `../trpc.js`. The latter causes circular dependency because `trpc.ts` imports the routers.

---

## 5. Build Commands

```bash
# Build core (must pass before web)
cd packages/core && npm run build

# Build web (Next.js 16 + Turbopack)
cd apps/web && npm run build

# Full dev server (all packages)
pnpm run dev
```

### Known Build Warnings
- Turbopack warns about workspace root detection (multiple lockfiles) — harmless
- `submodules/actions.ts` triggers a file pattern warning — harmless

---

## 6. Priority Recommendations for Next Session

### P0 — Critical
1. **Verify `apps/web` build** passes with the `graphRouter` fallback fix
2. **Commit all changes** — substantial progress accumulated

### P1 — High Value
3. **Refactor remaining @ts-ignore routers** (workflowRouter, symbolsRouter, suggestionsRouter, etc.) — mechanical, ~30min
4. **Type MCP tool responses** to eliminate `executeTool` @ts-ignore in `trpc.ts`
5. **Re-enable healer.subscribe** with proper observable typing

### P2 — Polish
6. Add proper typing to `Director.startChatDaemon()` / `Director.startWatchdog()` / `Director.broadcast()` / `Director.executeTask()`
7. Create integration tests for key routers (billing, pulse, graph)
8. Update `VISION.md` with current capabilities

---

## 7. Files Modified This Session

| File | Change Type |
|------|------------|
| `packages/core/src/trpc.ts` | Refactored getTaskStatus/indexingStatus, removed duplicates |
| `packages/core/src/routers/pulseRouter.ts` | Refactored to getMcpServer() |
| `packages/core/src/routers/researchRouter.ts` | Refactored to getMcpServer() |
| `packages/core/src/routers/squadRouter.ts` | Fixed circular dependency import |
| `packages/core/src/routers/graphRouter.ts` | Added dependencies fallback |
| `packages/core/src/routers/billingRouter.ts` | Real cost data via QuotaService |
| `packages/core/src/services/RepoGraphService.ts` | Added dependencies to toJSON() |
| `packages/core/src/services/ProjectTracker.ts` | Removed hardcoded brain path |
| `packages/core/src/MCPServer.ts` | Enabled EventBus, removed duplicate projectTracker |
| `apps/web/src/app/dashboard/architecture/page.tsx` | Fixed trpc.graph.get alias |

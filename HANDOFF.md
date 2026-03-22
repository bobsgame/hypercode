# Handoff & Session Learnings (2026-03-21)

## Current State

Repo is clean (local). All typechecks pass.

- Current branch: `main`
- VERSION: `0.90.0`
- All CI workflows fixed (pnpm v9 → v10), badges will be green on next push

## What Landed This Session

### 1. MCP Router LKG Config Support
- feat(core/mcp): Implemented Last-Known-Good (LKG) configuration persistence in `MCPConfigStore` (`mcp_servers.lkg.json`).
- feat(core/mcp): Updated `MCPAggregator` to fallback to LKG configuration if the primary is missing or corrupted.
- feat(core/mcp): Exposed `isLKG` flag via `mcpRouter.getStatus`.
- feat(web/mcp): Added a prominent warning banner to the MCP Control Plane dashboard when running in LKG mode.
- test(core/mcp): Added comprehensive test suite for `MCPConfigStore` LKG logic.

### 2. Borg Orchestrator First-Class Dashboard Integration
- feat(web/dashboard): Created `BorgOrchestratorWidget` combining Council governance, sessions, vetoes, and debate history into a standalone module.
- refactor(web/dashboard): Redesigned the main dashboard view to feature the Orchestrator panel taking up half the page layout in a split-pane design.

### 3. Detailed Provider Billing & Usage Subpanels

- feat(web/billing): Implemented `ProviderDetailPanel` — a sliding sheet subpanel that drills down into granular quota data for individual providers. Includes tracking for primary consumption vs. limits, multiple usage windows (session, daily, weekly), and real-time technical status (auth method, data confidence, rate limits).
- feat(web/billing): Updated the main provider capabilities table to be interactive; clicking a row now opens the detail subpanel for that provider.
- feat(web/billing): Extended `normalizeBillingQuotaRows` to include `windows` and `resetDate` data, enabling rich drilldown views.
- refactor(ui): Added `indicatorClassName` support to the shared `Progress` component in `@borg/ui`, allowing for semantic progress bar coloring.
- chore: Bumped `VERSION` to `0.10.29`.

### 2. BobbyBookmarks-backed link backlog slice

The first real Borg-native backlog datasource is now implemented.

- Added persistent `links_backlog` storage in:
  - `packages/core/src/db/metamcp-schema.ts`
  - `packages/core/src/db/index.ts`
- Added repository layer:
  - `packages/core/src/db/repositories/links-backlog.repo.ts`
  - export wired via `packages/core/src/db/repositories/index.ts`
- Added BobbyBookmarks adapter + normalization helpers:
  - `packages/core/src/services/bobby-bookmarks-adapter.ts`
  - `packages/core/src/services/bobby-bookmarks-adapter.test.ts`
- Added tRPC surface:
  - `packages/core/src/routers/linksBacklogRouter.ts`
  - registered in `packages/core/src/trpc.ts`
- Added operator UI:
  - `apps/web/src/app/dashboard/links/page.tsx`
  - nav wiring in `apps/web/src/components/mcp/nav-config.ts`

This is now the canonical Borg link backlog surface and the first foundation for the universal integrated MCP directory.

### 2. Borg Orchestrator integration cleanup

The active rename/integration pass was completed far enough to make the product feel coherent.

- Canonical route alias:
  - `apps/web/src/app/dashboard/orchestrator/page.tsx` → re-exports the upgraded dashboard page
- Legacy compatibility page updated:
  - `apps/web/src/app/dashboard/autopilot/page.tsx`
- Env/config compatibility cleanup:
  - `apps/web/.env.example`
  - `packages/core/src/orchestrator/council/services/config.ts`
- Related UI/documentation cleanup:
  - `apps/web/src/app/dashboard/jules/page.tsx`
  - `apps/web/src/app/dashboard/mcp/ai-tools/page.tsx`
  - `packages/core/src/routers/supervisorRouter.ts`
  - `docs/council/README.md`
  - `docs/council/ARCHITECTURE.md`
  - `docs/SUBMODULES.md`

Important: legacy `AUTOPILOT_*` / `NEXT_PUBLIC_AUTOPILOT_*` compatibility is still intentionally supported where needed. Canonical naming is now `BORG_ORCHESTRATOR_*`.

## Validation Already Completed

These commands passed after the landed changes:

```powershell
pnpm --filter @borg/core exec vitest run src/services/bobby-bookmarks-adapter.test.ts
pnpm --filter @borg/core build
## What Landed This Sprint

### 1. CI/CD Green Build Restoration
- Fixed `pnpm/action-setup@v4` version `9` → `10` in `.github/workflows/ci.yml` (×6), `release.yml` (×1), `benchmark.yml` (×1)
- Root cause: `pnpm@10.28.0` packageManager lock → `ERR_PNPM_BAD_PM_VERSION` with v9

### 2. README Visual Overhaul
- `README.md` redesigned: hero, 4 badge rows, stats/graph/streak widgets, screenshot grid
- Screenshot tracking table preserved (required by `sync-screenshot-status.mjs`)

### 3. .gitignore Hygiene
- Added `.autopilot/`, `**/.autopilot/`, `.build-output.log`, `**/.build-output.log`

### 4. Unified MCP Directory (done, verified)
- `packages/core/src/routers/unifiedDirectoryRouter.ts` — list + stats procedures
- Router registered as `unifiedDirectory:` in `packages/core/src/trpc.ts`
- Page at `apps/web/src/app/dashboard/mcp/unified-directory/page.tsx`
- Nav entry in `apps/web/src/components/mcp/nav-config.ts`

### 5. Code Mode Escape Hatch
- `packages/core/src/routers/codeModeRouter.ts` — `getStatus`, `enable`, `disable`, `execute`
- Registered as `codeMode:` in `packages/core/src/trpc.ts`
- `apps/web/src/app/dashboard/code/page.tsx` now includes:
  - Live Code Mode status panel (enabled indicator, tool count, context reduction %)
  - Enable/Disable toggle
  - Registered tools table
  - Direct code execution editor with output display
- Core package rebuilt to regenerate `.d.ts` types

### 6. Documentation
- `CHANGELOG.md` updated to `v0.10.28`
- `MEMORY.md` updated with pnpm, screenshot sync, release gate notes
- `DEPLOY.md` updated with pnpm v10 requirement and release gate instructions
- `VERSION` bumped to `0.10.28`
- `TODO.md` marked model fallback logic as `[x]` complete

## Validation Completed

```powershell
pnpm -C packages/core build                             # exit 0
pnpm -C packages/core exec tsc --noEmit --pretty false  # exit 0
pnpm -C apps/web exec tsc --noEmit --pretty false       # exit 0
```

## Next Priority Items (from TODO.md)

- TOON format parsing and MCP traffic inspection panels
- BobbyBookmarks integration refinement (dedupe, research-status, clustering)
- Fully wire Council debate to `SmartPilot` trigger for autonomous self-correction
Create:
- Dynamic progressive tool disclosure (initially show 5-6 meta tools, then expand on use)
- Multi-step reasoning trace playback panel in dashboard
- Evidence Lock persistence layer for cross-session verification

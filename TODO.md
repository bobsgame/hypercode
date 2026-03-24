# Borg TODO List

_Short-term tasks, bug fixes, and feature implementations. For long-term goals, see ROADMAP.md._

## Critical — Build & Type Safety
- [x] Fix `council/index.ts` — expose `members`/`updateMembers` at top level for `providers/routing/page.tsx` build fix.
- [ ] Ensure `council.json` config file exists at `packages/core/config/council.json` with default members for fresh installs.
- [ ] Clean up orphaned `routers/councilRouter.ts` (top-level) — its logic is now inlined into `council/index.ts`.

## UI & Dashboard (apps/web)
- [x] Implement Dashboard page/panel listing submodules, versions, dates, and exact repository locations.
- [x] Polish the Roundtable/Council UI enough to render live sessions, history, and Smart Pilot compatibility.
- [x] Wire a non-destructive "Add Borg as MCP server" action into the Integration Hub.
- [x] Implement "Code Mode" escape hatch interface in the dashboard.
- [x] Create detailed usage/billing subpanels tracking credit balances per provider.
- [x] Build Unified Directory merging installed servers + backlog links.
- [ ] **Marketplace page** (`/dashboard/marketplace`, 136 lines) — currently calls `MarketplaceService` which has TODO stubs for MeshService peer queries. Wire up actual community entries or catalog data.
- [ ] **Config page** (`/dashboard/config`, 14 lines) — minimal wrapper around DirectorConfig component. Expand with the full system settings surface (themes, notifications, data retention, etc.).
- [ ] **Workshop page** — delegates to `@borg/ui` `WorkshopPage`. Verify this component is fully implemented in the UI package.

## Orchestration & Models
- [x] Implement robust model fallback logic with quota-aware cascading.
- [x] Ensure auto-start/restart logic handles all 11 CLI harness types.
- [x] Implement OAuth logic for subscribing to premium models.
- [x] Fully wire up the Council debate to SmartPilot.
- [ ] **MeshRouter** (`meshRouter`) — currently commented out in `trpc.ts`. The P2P mesh networking layer for distributed Borg instances is scaffolded but disabled. Re-enable when MeshService is stable.

## MCP Substrate & Proxies
- [x] Improve MCP router startup with LKG configuration.
- [x] Build the universal integrated MCP directory.
- [x] Implement dynamic progressive tool disclosure.
- [x] Add tool semantic search / tool RAG.
- [x] Implement TOON format parsing and MCP traffic inspection.
- [x] Build environment variable and secrets management.

## Memory & RAG
- [x] Integrate BobbyBookmarks as canonical link backlog datasource.
- [x] Connect memory subsystem to Google Workspace (Docs, Gmail, Drive).
- [x] Implement browser extension endpoints.
- [x] Integrate NotebookLM-style citation features.
- [ ] **MarketplaceService TODO stubs** — `MarketplaceService.ts` lines 90 and 113 have TODO comments for MeshService integration (peer discovery and broadcasting). Implement or remove.
- [ ] **CitationService** — uses keyword-based relevance as placeholder for vector similarity (noted in MEMORY.md). Upgrade to LanceDB embedding queries in production.

## Documentation
- [x] Create/Update MEMORY.md, DEPLOY.md, CHANGELOG.md.
- [x] Refine AGENTS.md, GEMINI.md, CLAUDE.md, GPT.md with Universal LLM Instructions reference.
- [ ] Ensure `docs/SUBMODULES.md` is current with all 7 active submodules.
- [ ] Update `docs/VERSION_LOCATIONS.md` after version bump to 0.99.2.

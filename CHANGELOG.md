# Changelog

All notable changes to this project will be documented in this file.

## [2.6.2] - 2026-02-12

### Fixed

- **Dashboard Build Stabilization (18 component fixes)**:
  - Fixed 6 disabled router references (TraceViewer, SystemStatus, RemoteAccessCard, GlobalSearch, ConfigEditor, TestStatusWidget) — replaced with static placeholder UI
  - Fixed TrafficInspector `handleReplay()` — disabled `logs.read` router replaced with console warning
  - Fixed router name mismatches: `context`→`borgContext` (ContextWidget), `repoGraph`→`graph` (GraphWidget), `audit.getLogs`→`audit.query` (AuditLogViewer)
  - Fixed procedure: `shell.execute`→`commands.execute` (CommandRunner), input shape `path`→`filePath` (ContextWidget)
  - Fixed union type access with safe casts: IndexingStatus, SystemPulse, CouncilConfig
  - Fixed Badge variants: `"success"`→`"default"` (SystemPulse, evolution/page, security/page)
  - Fixed SkillsViewer: `data.tools`→direct array access
  - Removed stale `@ts-expect-error` from KnowledgeGraph.tsx

### Added

- **Dependencies**: `react-force-graph-2d` for KnowledgeGraph 2D visualizer
- **Build**: Clean build with 39 routes, exit code 0

## [2.6.1] - 2026-02-11

### Fixed

- **tRPC Router Stability**:
  - Fixed duplicate `health` and `getTaskStatus` keys in `appRouter` (TS1117 build error)
  - Fixed `graphRouter.get` fallback to include `dependencies: {}` (union type mismatch)
  - Fixed `squadRouter.ts` circular dependency (`../trpc.js` → `../lib/trpc-core.js`)
  - Removed duplicate `ProjectTracker` initialization in `MCPServer.ts`
  - Disabled `AutoTestWidget` (router is commented out) — replaced with informational placeholder
  - Made `KnowledgeGraph` component props optional with sensible defaults
- **tRPC v11 Migration**:
  - Replaced deprecated `isLoading` → `isPending` in `code/page.tsx`, `settings/page.tsx`, `memory/page.tsx`, `council/page.tsx`
  - Fixed `evolution/page.tsx` `onError` type annotation (removed explicit `Error` type for tRPC v11 inference)
  - Fixed `evolution/page.tsx` `Badge` variant from invalid `"success"` to `"default"`
- **Disabled Router Pages**:
  - Fixed `knowledge/page.tsx` — replaced `trpc.submodule.*` calls with static data (router disabled)
  - Fixed `mcp/page.tsx` — replaced `trpc.mcp.*` calls with static placeholder UI (router disabled)

### Changed

- **@ts-ignore Cleanup (87 comments removed across 14 routers)**:
  - `shellRouter` (6), `testsRouter` (2), `skillsRouter` (5), `suggestionsRouter` (7)
  - `graphRouter` (4), `workflowRouter` (10), `symbolsRouter` (14), `squadRouter` (5)
  - `settingsRouter` (1), `researchRouter` (2), `memoryRouter` (8)
  - `contextRouter` (10), `commandsRouter` (4), `autoDevRouter` (10)
  - All now use `getMcpServer()` helper with `(mcp as any)` type assertions instead of `global.mcpServerInstance`

### Added

- **Real Data Wiring**:
  - `billing.getStatus` now returns real cost data via `QuotaService.getUsageByModel()`
  - `getTaskStatus` now returns real progress from `ProjectTracker.getStatus()`
  - `indexingStatus` now returns real state from `LSPService`
  - `pulseRouter.getLatestEvents` now reads from `EventBus` history buffer
  - `RepoGraphService.toJSON()` now includes raw `dependencies` map for frontend consumption
  - `EventBus` initialization enabled in `MCPServer.ts`
- **Documentation**:
  - `HANDOFF_ANTIGRAVITY.md` — comprehensive deep analysis: 25 routers, 30 services, 31 dashboard pages, @ts-ignore inventory, priority recommendations
  - Updated `ROADMAP.md` Phase 63 with completed item tracking
  - Updated `ProjectTracker` to prioritize local `task.md`/`docs/task.md` over hardcoded brain path


## [2.6.0] - 2026-02-08

### Added

- **Phase 57: Resilient Intelligence**:
  - **Model Fallback**: Automatic provider switch on 429 quota errors in `LLMService`.
  - **Director Hardening**: Fixed focus-stealing in auto-drive loop. Added emergency brake (>5 directives in 2 min → 5 min cooldown).
  - **SessionManager**: New `SessionManager` service for persisting agent state across restarts. Fully wired into `MCPServer.ts`.
  - **Session tRPC Router**: New `sessionRouter.ts` with `getState`, `updateState`, `clear`, `heartbeat` endpoints.
- **Phase 58: Grand Unification**:
  - **Integration Test V2**: `test_grand_unification_v2.ts` covering SessionManager, Director, and core infrastructure.

### Changed

- **Documentation Overhaul (v2.6.0)**:
  - Rewrote `docs/UNIVERSAL_LLM_INSTRUCTIONS.md` — now 200+ lines with project structure, tech stack, git protocol, coding standards, agent orchestration, user preferences, quality checklist.
  - Rewrote `CLAUDE.md` — full role definition (Architect), session protocol, model variants.
  - Rewrote `GEMINI.md` — full role definition (Critic/Researcher), session protocol, model variants.
  - Rewrote `GPT.md` — full role definition (Builder), session protocol, model variants.
  - Rewrote `GROK.md` — full role definition (Innovator), removed dead `CORE_INSTRUCTIONS.md` reference.
  - Rewrote `CODEX.md` — full role definition (Specialist), integration flow.
  - Rewrote `copilot-instructions.md` — added project context, code generation guidelines, key file references.
  - Updated `AGENTS.md` — comprehensive feature wishlist preserved, added preamble.

### Fixed

- **VERSION Desync**: `VERSION` (was 2.4.0) and `VERSION.md` (was 2.5.0) now both synced to 2.6.0.
- **SessionManager Wiring**: Previous session failed to wire `SessionManager` into `MCPServer.ts` (3-line import/property/constructor fix).

## [2.5.0] - 2026-02-07

### Added

- **Phase 46: Core Engine & Dashboard Rebuild**:
  - **Full CLI**: Complete Commander.js CLI with 11 command groups (start, status, mcp, memory, agent, session, provider, tools, config, dashboard, about) each with comprehensive subcommands, --json output, colored tables, help text with examples.
  - **WebUI Dashboard**: Full Vite+React+Tailwind SPA with dark neural theme. Pages: Dashboard overview, MCP Router (servers/tools/traffic/config/directory tabs), Memory (browse/search/import-export/config), Agents (spawn/chat/metrics), Sessions (manage/export/cloud), Providers (quota/OAuth/fallback chain), Tools (search/groups/enable-disable), Skills library, Config editor, About/submodule dashboard.
  - **VISION.md**: Comprehensive 500+ line vision document covering all project goals, architecture, feature parity targets, and design philosophy.
  - **LLM Instructions Overhaul**: Rewrote AGENTS.md, CLAUDE.md, GEMINI.md, GPT.md, GROK.md, CODEX.md, copilot-instructions.md with universal instructions reference, model-specific roles, changelog/version protocols.
  - **docs/UNIVERSAL_LLM_INSTRUCTIONS.md**: Complete coding standards, documentation protocol, git protocol, architecture rules, session protocol, quality standards.
  - **VERSION.md**: Single source of truth for version number (2.5.0), referenced at runtime.
  - **Version Sync**: All package.json files, VERSION.md, and CHANGELOG.md synchronized to 2.5.0.

### Changed

- Upgraded root monorepo version from 2.4.0 to 2.5.0
- Restructured WebUI from basic status-cards to full multi-page dashboard SPA
- CLI expanded from 2-file stub to full 11-command-group CLI application

## [2.4.0] - 2026-02-07

### Added

- **Phase 45: Knowledge Assimilation & Dashboard Expansion**:
  - **Knowledge Dashboard**: `/dashboard/knowledge` now acts as a central hub for all external intelligence (MCPs, Skills, Docs).
  - **Ingestion Pipeline**: Automated script (`scripts/ingest_resources.ts`) to assimilate vast resource lists into structured knowledge.
  - **Submodule Service**: New `SubmoduleService` to health-check and sync the massive plugin ecosystem.
- **Phase 44: The Immune System (Self-Healing)**:
  - **HealerReactor**: Autonomous error detection loop (Terminal -> Sensor -> Healer).
  - **Auto-Fix**: System can now self-diagnose and patch simple code errors without human intervention.
  - **Immune Dashboard**: `/dashboard/healer` visualizes active infections and immune responses.

## [2.3.0] - 2026-02-06

### Added

- **Phase 36 (Release & Observability)** (In Progress):
  - Enhanced Submodules Dashboard with project structure visualization and detailed versioning.
- **Phase 35 (Standardization & Polish)**:
  - **Code Hygiene**: Resolved 150+ lint errors in frontend.
  - **Library UI**: Launched `/dashboard/library` showing Prompts and Skills.
- **Phase 34 (Evolution - The Darwin Protocol)**:
  - **DarwinService**: Mutation engine for A/B testing prompts.
  - **Evolution UI**: `/dashboard/evolution` for managing agent experiments.
- **Phase 33 (Self-Correction - The Healer)**:
  - **HealerService**: Automated error analysis and fix suggestion loop.
- **Phase 32 (Security & Governance - The Guardian)**:
  - **PolicyService**: RBAC and Scope enforcement for tools.
  - **Security Dashboard**: `/dashboard/security` for audit logs and policy management.
- **Phase 31 (Deep Research - The Scholar)**:
  - **DeepResearchService**: Multi-step recursive research agent.

## [2.2.1] - 2026-02-05

### Fixed

- **Development Experience**: Resolved persistent console clearing issues during `pnpm run dev`.
  - Added `--preserveWatchOutput` to all `tsc` watch scripts.
  - Added `clearScreen: false` to Vite config.
  - Monkey-patched `console.clear` in Next.js config.
  - Updated CLI to use `tsx watch --clear-screen=false`.
- **Extension Bridge**: Verified active WebSocket server on port 3001.

## [2.2.0] - 2026-02-04

### Added

- **Phase 23 (Deep Data Search)**:
  - Created `Indexer` and `CodeSplitter` in `@borg/memory`.
  - Added AST-based symbol extraction for TypeScript.
  - Added semantic chunking logic.
  - Exposed `memory_index_codebase` and `memory_search` tools in `MCPServer`.
  - Implemented `VectorStore.addDocuments` for batch processing.

## [2.1.0] - 2026-02-04

### Added

- **Master MCP Server Architecture (Phase 21)**: Borg now aggregates downstream MCP servers (`git`, `filesystem`, etc.) via `MCPAggregator`.
- **Stdio Client**: Native integration for spawning and controlling local MCP tools.
- **Unified Documentation**: Centralized all agent instructions into `docs/LLM_INSTRUCTIONS.md`.
- **Vision Document**: Published `VISION.md` outlining the "Neural Operating System" goal.
- **Centralized Versioning**: Project version is now master-controlled by the `VERSION` file.

### Changed

- **Config**: `borg.config.json` is now the primary configuration point for adding tools.
- **Routing**: Tool calls are now prefixed (e.g., `git_commit`) to allow namespace isolation between multiple servers.

## [1.7.0] - 2026-02-03

### Added

- **Core Infrastructure**: Registered LSP, Code Mode, and Plan Mode tools in MCPServer.
- **Verification**: Added `CoreInfra.test.ts`.

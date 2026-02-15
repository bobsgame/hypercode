# Borg — Master TODO List

> **Generated**: 2026-02-15 | **Version**: 2.6.2 | **Phase**: 63 (Codebase Hardening)
> **Priority**: P0 (Critical) → P1 (High) → P2 (Medium) → P3 (Low)

---

## P0 — Critical (Build & Trust)

### Build Stability
- [x] **Fix Mermaid webpack import compatibility** in `apps/web/src/components/Mermaid.tsx` (replaced CDN `https://` import with local package import)
- [ ] **Continue strict-typing cleanup in shared UI components**
  - Latest observed blocker: `packages/ui/src/components/ContextPanel.tsx`
  - Prior blockers resolved in workflows/council/director/search/indexing/trace/chronicle surfaces
- [x] **Fix 3 remaining `@ts-ignore`** in `council/page.tsx` — replaced with `CouncilSession` interface + safe cast
- [x] **Verify `apps/web` build** — `tsc --noEmit` passes (exit 0), `next build` passes with 8GB heap
- [x] **Fix `skill: any` cast** in `skills/page.tsx` — already has `normalizeSkills()` + `SkillListItem` interface

### Auth Completion
- [x] **Auth submit flows already wired** — `LoginForm.tsx` calls `/api/auth/login` via fetch; all 3 API routes (`login`, `signup`, `forgot-password`) fully implemented with `authStore` library

### Dashboard Data Integrity
- [x] **Replaced `super-assistant/page.tsx`** — now shows real MCP data (tools, servers, skills) via tRPC
- [x] **Fixed Turbopack broad-pattern warnings** — 7 path traversals in 5 files replaced with `getMonorepoRoot()` helper

---

## P1 — High Priority (Feature Completion)

### Phase 62: Ignition (Real Agent Capabilities)
- [ ] **CoderAgent real LLM integration** — `expertRouter.code` procedure uses `AutoDevService` but needs verified end-to-end task execution
- [ ] **ResearcherAgent DeepResearch integration** — `expertRouter.research` calls `DeepResearchService.recursiveResearch()` — verify with live API key
- [ ] **Fix Skill Registry API mismatch** — `skills.list` endpoint exists but frontend comment says "Placeholder for now until list endpoint is robust"
- [ ] **Real Memory Graph Visualization** — remove any mock data in `brain/page.tsx`, wire to `agentMemory` router

### Phase 63.B: Backend Realism
- [ ] **Wire MetaMCP execution handler** — `metamcp-proxy.service.ts:615` has TODO for execution.handler logic
- [ ] **Implement MemoryManager VectorProvider abstraction** — `MemoryManager.ts:302` TODO
- [ ] **Add context pruning summary messages** — `ContextPruner.ts:97` TODO
- [ ] **Improve functional-middleware typing** — `functional-middleware.ts:88` TODO

### Submodule Dashboard V2 (DONE ✅)
- [x] **Backend**: `git.ts` reads `package.json` for version/name
- [x] **Frontend**: `submodules/page.tsx` displays Package and Version columns

### Documentation
- [ ] **Create `docs/DEPLOY.md`** — deployment guide with Node 22 vs 24 advice, `better-sqlite3` bindings warning
- [ ] **Create `docs/MEMORY.md`** — memory system architecture, backend selection, configuration
- [ ] **Create `docs/SUBMODULE_MAP.md`** — list every reference repo and its location in `references/`
- [ ] **Update `VISION.md`** — add completion percentages for each pillar

---

## P2 — Medium Priority (Feature Expansion)

### New Dashboard Pages
- [ ] **AI Tools Dashboard** (`/dashboard/mcp/ai-tools`) — billing/usage/OAuth for OpenAI, Anthropic, Gemini, xAI
- [ ] **Jules Integration** (`/dashboard/jules`) — cloud dev environment management
- [ ] **Policy Editor Enhancement** — real-time policy testing in `/dashboard/mcp/policies`

### Service Exposure
- [ ] **Expose `MeshService`** via new `meshRouter` — P2P agent coordination (Phase 64 preview)
- [ ] **Expose `BrowserService`** via new `browserRouter` — browser automation control
- [ ] **Expose `CodeModeService`** via dedicated router — currently indirect through `autoDev`

### Type Hardening (Continued)
- [ ] **Type `DeepResearchService` constructor** — replace `server: any` with typed `MCPServer` reference
- [ ] **Type `KnowledgeService.getGraph` return** — replace `content: any[]` with structured type

### Verify Orphaned Dashboard Pages (ALL VERIFIED ✅)
- [x] **`/dashboard/chronicle`** — static `@borg/ui` component
- [x] **`/dashboard/events`** — wired to `pulse.getLatestEvents`
- [x] **`/dashboard/library`** — static `@borg/ui` component
- [x] **`/dashboard/manual`** — static documentation page
- [x] **`/dashboard/reader`** — wired to `executeTool` mutation
- [x] **`/dashboard/security`** — wired to `audit.list` + `autonomy.setLevel`
- [x] **`/dashboard/mcp/observability`** — wired to `logs.list` (real analytics)
- [x] **`/dashboard/mcp/search`** — wired to `tools.list` (client-side filter)
- [x] **`/dashboard/mcp/registry`** — mock data (hardcoded server list)
- [x] **`/dashboard/mcp/docs`** — static documentation
- [x] **`/dashboard/mcp/inspector`** — wired to `tools.list` + `agent.runTool`

---

## P3 — Low Priority (Polish & Future)

### Browser Extension
- [ ] **Implement MCP bridge** in `apps/extension` — full browser↔Borg WebSocket connectivity
- [ ] **Memory sync** — store/retrieve memories from browser browsing sessions
- [ ] **Manual test** — Chrome extension connection to `ws://localhost:3001`

### Session Management
- [ ] **Cloud session parity** — transfer/broadcast workflows (Sessions § 2.6 in VISION.md)
- [ ] **Auto-start previous sessions on boot**
- [ ] **Mobile-responsive remote management**

### RAG Pipeline
- [ ] **Multiple chunking strategies** — code-aware, semantic, fixed (§ 2.9 in VISION.md)
- [ ] **Google Docs/Drive integration**
- [ ] **OCR for image intake**

### Advanced Features (Phase 64+)
- [ ] **Phase 64: The Mesh** — P2P agent swarm coordination
- [ ] **Phase 65: The Marketplace** — decentralized tool/agent marketplace
- [ ] **Phase 66: The Neural Link** — BCI integration patterns
- [ ] **Phase 67: The Hive Mind** — shared learning across instances

---

## Verification Checklist

Before any release:
- [ ] `apps/web` builds with zero errors (`npm run build`)
- [ ] `packages/core` compiles (`npx tsc --noEmit`)
- [ ] No `@ts-ignore` in dashboard pages
- [ ] `pnpm run check:placeholders` passes
- [ ] `VERSION.md`, all `package.json` versions, and `CHANGELOG.md` are in sync
- [ ] `HANDOFF_ANTIGRAVITY.md` is current

---

*Generated by Antigravity during comprehensive deep analysis session.*

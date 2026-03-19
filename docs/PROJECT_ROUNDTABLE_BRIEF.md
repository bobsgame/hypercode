# Borg Project Roundtable Brief

_Last updated: 2026-03-19_

## Executive summary

**Borg** is already a real local AI control plane, not a concept demo.

Its strongest implemented pillars are:

- **MCP routing / aggregation / inspection**
- **provider fallback and billing/operator surfacing**
- **session supervision with restart, logs, persistence, and worktree scaffolding**
- **memory and observation infrastructure**
- **a very broad operator dashboard in `apps/web`**

Its biggest current risks are still:

- **documentation drift** between root, archive, and living code
- **scope inflation** relative to the believable 1.0 story
- **operator truth drift** when UI breadth gets ahead of runtime certainty
- **unfinished attach / cloud-dev / parity surfaces** that exist but are not uniformly kernel-grade
- **monorepo/reference noise** caused by archived projects, submodules, and parallel experiments

The best current framing is:

> Borg should become the **truthful local operations kernel for AI-assisted development**.
>
> It should win by coordinating sessions, providers, tools, memory, and operator workflows reliably — not by pretending every adjacent idea is already production-ready.

---

## What Borg is

Borg is best understood as a **local AI operations control plane** with five major kernel responsibilities:

1. **MCP Router / Aggregator** — aggregate many MCP servers behind one Borg endpoint, keep them searchable/inspectable, and progressively expose tools.
2. **Provider Router / Fallback Engine** — normalize providers, manage fallback order, surface billing/auth/quota truth where possible.
3. **Session Supervisor** — spawn and monitor external CLI sessions, capture logs/health, and isolate workspaces/worktrees when needed.
4. **Operator Dashboard** — expose truthful state and controls in the web UI.
5. **Memory / Context Layer** — persist observations, facts, prompts, summaries, and links across sessions.

This matches the current architecture notes in `archive/ARCHITECTURE.md`, `VISION.md`, `README.md`, and the active code structure in `packages/core` and `apps/web`.

---

## Current source-of-truth map

The repo currently has **two realities**: living code and partially stale canonical docs.

### Most trustworthy sources today

- `README.md` — public-facing product framing
- `VISION.md` — long-horizon ambition
- `CHANGELOG.md` — best evidence of what has actually changed
- `archive/ROADMAP.md` — best current roadmap content
- `archive/TODO.md` — best current blocker queue
- `archive/tasks/active/*.md` — actual current execution slices
- `packages/core/src/**` and `apps/web/src/app/dashboard/**` — runtime truth
- `BORG_MASTER_INDEX.jsonc` — current evidence-lock / documentation registry for the parity track

### Verified documentation drift / structural gaps

The following paths are still referenced by older materials, but were not present at the root during this audit:

- `AGENTS.md`
- `ARCHITECTURE.md`
- `DESIGN.md`
- `ROADMAP.md`
- `TODO.md`
- `DEPLOY.md`
- `MEMORY.md`
- `tasks/active/**`

What actually exists today:

- roadmap/todo/task material lives under `archive/ROADMAP.md`, `archive/TODO.md`, and `archive/tasks/**`
- current product/runtime state is most visible through code and `CHANGELOG.md`
- `BORG_MASTER_INDEX.jsonc` still indexes some docs that do not currently exist at the listed paths

That drift is important enough to treat as a first-class product/documentation issue, not mere housekeeping.

---

## Monorepo inventory

### Top-level apps

#### `apps/web`

The main Mission Control dashboard and the most mature user-facing surface.

Key route groups visible under `apps/web/src/app/dashboard/`:

- core/operator: `system`, `health`, `logs`, `audit`, `architecture`, `security`, `settings`
- MCP: `mcp`, `mcp/search`, `mcp/inspector`, `mcp/system`, `mcp/tools`, `mcp/tool-sets`, `mcp/registry`, `mcp/namespaces`, `mcp/settings`, `mcp/testing`, `mcp/scripts`, `mcp/docs`, `mcp/api-keys`, `mcp/agent`, `mcp/observability`
- sessions / autonomy: `session`, `supervisor`, `director`, `council`, `swarm`, `agents`, `squads`, `plans`, `healer`, `experts`
- memory / research / context: `memory`, `knowledge`, `context`, `research`, `reader`, `intake`, `ingestion`, `library`, `brain`, `chronicle`
- providers / integrations: `billing`, `providers`, `integrations`, `cloud-dev`, `jules`, `autopilot`, `webui`, `super-assistant`, `browser`
- dev / analysis surfaces: `tests`, `code`, `symbols`, `project`, `command`, `workflow`, `workshop`, `marketplace`, `submodules`, `metrics`, `events`, `evolution`, `pulse`, `infrastructure`

This is a **broad** surface area. Some of it is mature enough to count. Some of it is clearly still beta/experimental/adaptor-oriented.

#### `apps/borg-extension`

Browser extension build/artifact workspace. The repo has recent evidence that Chromium/Firefox artifacts were validated, but extension breadth and runtime parity remain uneven.

#### `apps/vscode`

VS Code integration workspace. Present, but not central to the current 1.0 release story.

### Top-level package families

#### Core kernel packages

- `packages/core` — main runtime, routers, services, MCP control plane, session supervision, provider logic, memory, observability
- `packages/cli` — CLI entry and terminal-facing interaction
- `packages/types` — shared schemas/types
- `packages/ui` — shared UI utilities/components/hooks

#### Memory / AI / research related packages

- `packages/memory`
- `packages/ai`
- `packages/agents`
- `packages/adk`
- `packages/search`

#### Integrations / adjunct packages

- `packages/browser`
- `packages/mcp-client`
- `packages/mcp-registry`
- `packages/mcp-router-cli`
- `packages/tools`
- `packages/supervisor-plugin`
- `packages/vscode`
- `packages/zed-extension`
- `packages/jetbrains`

#### Reference / imported / parallel workspaces

- `packages/claude-mem`
- `packages/claude-mem.worktrees`
- `archive/**` reference projects and historical material

### Submodule inventory (`.gitmodules`)

Verified current submodule declarations:

| Path | Source | Role in Borg today |
|---|---|---|
| `archive/opencode-autopilot` | `robertpelloni/opencode-autopilot` | Reference/integration target for autopilot dashboard and council ideas |
| `external/MetaMCP` | `robertpelloni/MetaMCP` | Important MCP router reference and package source |
| `archive/submodules/mcpproxy` | `Dumbris/mcpproxy` | MCP proxy reference |
| `archive/submodules/litellm` | `BerriAI/litellm` | Provider/fallback/billing reference |
| `archive/claude-mem` | `robertpelloni/claude-mem` | Memory adapter/reference |
| `archive/OmniRoute` | `diegosouzapw/OmniRoute` | Routing/orchestration reference |
| `packages/claude-mem` | `robertpelloni/claude-mem` | Active workspace/reference adapter |

The repo therefore contains both **active first-party code** and **reference ecosystems**. That is powerful, but it increases the burden of documentation truthfulness.

---

## What is implemented and materially works

This section is intentionally conservative: it focuses on features supported by code structure and recent `CHANGELOG.md` evidence.

### 1. Startup / readiness contract

Evidence:

- `packages/core/src/routers/startupStatus.ts`
- `scripts/dev_tabby_ready.mjs`
- `scripts/verify_dev_readiness.mjs`
- recent changelog entries `2.7.327` through `2.7.329`

What works:

- startup readiness is explicitly modeled and exposed
- dashboard startup/home/system surfaces consume that contract
- fresh-install / zero-server permanent-pending regressions were fixed
- focused startup tests were re-run and documented

Current confidence: **high**

### 2. MCP router / inventory / telemetry / operator inspection

Evidence:

- `packages/core/src/routers/mcpRouter.ts`
- `packages/core/src/routers/mcpServersRouter.ts`
- `packages/core/src/mcp/**`
- `apps/web/src/app/dashboard/mcp/**`
- extensive changelog coverage across search, inspector, working-set, loader, discovery, and telemetry

What works:

- managed MCP server inventory and config-backed server registry
- cached inventory + live inspection distinction
- server reload decision surfacing
- working-set capacity / eviction telemetry
- search and inspector dashboards with increasingly rich telemetry drilldowns
- loader split / cached inventory warmup behavior
- discovery preflight guards for placeholder config and missing local commands

Current confidence: **high for operator visibility, medium-high for runtime stability**

### 3. Session supervisor runtime

Evidence:

- `packages/core/src/supervisor/**`
- `packages/core/src/routers/sessionRouter.ts`
- `apps/web/src/app/dashboard/session/**`
- changelog entries `2.7.323`, `2.7.334`
- focused supervisor tests passing after recent fixes

What works:

- create/start/stop/restart supervised sessions
- persist and restore session state
- capture logs and health state
- display detailed session information in web UI
- bounded restart semantics exist
- worktree plumbing exists and was recently corrected so only conflicting sessions allocate worktrees

Current confidence: **medium-high**

### 4. Provider routing / billing operator surface

Evidence:

- `packages/core/src/routers/billingRouter.ts`
- provider-related routes under `packages/core/src/routers/**`
- `apps/web/src/app/dashboard/billing/**`
- changelog entries around billing truthfulness and provider data fidelity

What works:

- fallback chain and routing reasons are exposed
- billing page exists and is non-trivial
- operator-visible provider confidence/fidelity states exist
- provider auth/quota truthfulness has had explicit attention

Current confidence: **medium**

### 5. Memory / observation / context model

Evidence:

- `packages/core/src/services/AgentMemoryService.ts`
- `packages/core/src/services/agentMemoryPivot.ts`
- `packages/core/src/services/agentMemoryTimeline.ts`
- `packages/core/src/services/agentMemoryConnections.ts`
- `packages/core/src/routers/memoryRouter.ts`
- `apps/web/src/app/dashboard/memory/**`

What works:

- memory CRUD / search / multiple record types
- session-linked pivots and timelines
- cross-session related-record views
- structured observation capture exists in core
- scalar-safe sanitization for LanceDB/Arrow write stability

Current confidence: **medium-high**

### 6. Dashboard maturity / honesty pass

Evidence:

- `PageStatusBanner` and maturity badges across numerous routes
- changelog entries marking beta/experimental/embed surfaces
- route lists under `apps/web/src/app/dashboard/**`

What works:

- the dashboard now explicitly labels many surfaces as beta / experimental / embed
- route badge parity was implemented across sidebar, command palette, and page banners
- the project is moving away from “everything looks shipped” theater

Current confidence: **high as a direction, medium as a finished state**

### 7. Cloud-dev / Jules / provider-hub surfaces

Evidence:

- `apps/web/src/app/dashboard/cloud-dev/**`
- `apps/web/src/app/dashboard/jules/**`
- `apps/web/src/app/dashboard/providers/**`
- changelog entries for providers hub and cloud-dev UX fixes

What works:

- provider/account link hub exists
- cloud-dev session panels exist
- chat auto-scroll and forced-send semantics were improved
- OpenCode Autopilot dashboard integration exists

Current confidence: **medium**

---

## What exists but is still partial / uneven

These areas are real, but not yet “kernel-grade and boring.”

### MCP runtime stability under practical smoke conditions

Still active:

- `archive/tasks/active/025-mcp-dashboard-runtime-smoke-and-import.md`

Why still partial:

- route/import regressions have been fixed repeatedly
- realistic import payloads remain an explicit active task
- normal polling/import/edit loop confidence still needs fresh smoke validation

### Session supervisor attach / interaction story

Still active:

- `archive/tasks/active/026-session-supervisor-worktree-attach.md`

Why still partial:

- session detail UI is strong
- restart policy visibility is improving
- but attach / interaction semantics are still called out as an open requirement rather than fully settled product behavior

### Provider truthfulness

Why still partial:

- billing page is real
- provider confidence messaging is better
- but quota/auth/cost fidelity remains provider-specific and uneven
- roadmap still treats this as a top blocker

### Browser / extension / integration breadth

Why still partial:

- many integrations exist as surfaces or adapters
- breadth is impressive
- but dependable end-to-end workflows are not yet equally mature across providers and browser/IDE targets

### Memory story as a complete user product

Why still partial:

- strong backend foundations exist
- dashboard story is much stronger than before
- but the 1.5 target still calls for a more unified Borg-native memory UX and ingestion/provenance visibility

---

## What is planned but not done yet

This section synthesizes `archive/ROADMAP.md`, `archive/TODO.md`, `VISION.md`, active tasks, and current code drift.

### Borg 1.0 blockers still open

From the roadmap/todo, the unresolved 1.0 gate is still:

1. **Repeatable clean-start path** for local dev and Docker
2. **Stable MCP dashboard/runtime behavior** in normal operator loops
3. **Trustworthy session supervisor operator story** — especially worktree + attach flows
4. **Provider auth/quota/fallback truthfulness**
5. **Clear separation of shipped vs experimental surfaces**
6. **Task/doc workflow discipline**
7. **CI release gate confidence**
8. **Actual 1.0 release packaging**

### Borg 1.5 planned expansion

- stronger unified memory/search/timeline/provenance UX
- browser and IDE capture loops tied to memory
- context compaction / injection that measurably improves sessions
- stronger adapter strategy for external memory ecosystems

### Borg 2.0 planned expansion

- multi-agent orchestration and debate/council systems as real operations, not demos
- marketplace / plugin ecosystems
- cloud-dev federation and broader orchestration

### Parallel major track now active: evidence lock / built-in tool parity

`BORG_MASTER_INDEX.jsonc` shows a separate major documentation/productization track:

- phase 1 version pins complete
- phase 2 golden fixtures complete
- phase 3 validation foundation in progress
- six L2 platforms ready for L3 promotion

This is important, but it is **not identical** to the core Borg 1.0 operator-control-plane release path. It should be treated as a parallel strategic/doc-validation workstream.

---

## Current active implementation plan

The actual current execution queue is best reflected by the active archived task briefs.

### Active task 024 — Startup readiness smoke contract

Status: **mostly complete / validated**

Recent evidence says:

- clean readiness probes passed
- startup/dashboard semantics were aligned
- zero-server pending regressions were fixed
- focused tests passed

### Active task 025 — MCP dashboard runtime smoke and import robustness

Status: **active and still open**

Required next outcomes:

- no recurring `405/400` regressions in normal dashboard flows
- realistic import payload validation
- route compatibility tests kept aligned with live dashboard behavior

### Active task 026 — Session supervisor worktree and attach reliability

Status: **active and still open**

Required next outcomes:

- reliable worktree behavior in real runtime paths
- explicit attach / interaction story
- clearer restart/failure operator feedback

---

## Recommended roadmap from this point on

### Smallest believable Borg 1.0

Borg 1.0 should be:

- one installable local service
- one trustworthy dashboard
- one MCP router with inspectable live/cached semantics
- one provider router with explainable fallback
- one session supervisor with dependable restart/log/health behavior
- one memory layer that stores and retrieves what the UI claims it stores and retrieves

That is already a **serious** product. It does not need full feature parity with every external harness before 1.0.

### Next 6 slices I would give to frontier models to debate and rank

1. **MCP runtime smoke and import hardening**
   - close task 025 with realistic payloads and normal-loop smoke evidence
2. **Session attach/worktree contract**
   - close task 026 with explicit supported behavior, runtime tests, and UI wording
3. **Root-canonical documentation repair**
   - re-establish live root/docs paths for architecture/design/roadmap/todo/deploy/memory so future sessions stop following ghosts
4. **Provider truthfulness pass**
   - tighten auth/quota confidence and visible fallback causality
5. **Shipped-vs-experimental dashboard pruning pass**
   - make maturity labels undeniable and demote parity theater from the primary 1.0 story
6. **CI release gate consolidation**
   - convert the focused validations into an obvious release confidence gate

---

## Debate framing for multiple LLM models

The most useful debate questions are now:

1. What is Borg’s **smallest believable 1.0** if we optimize for trust, not hype?
2. Which current surfaces are truly **kernel-grade** and deserve deeper investment?
3. Which visible surfaces are **ornamental / premature / misleading** and should be quarantined?
4. Should the next major slice be **MCP runtime hardening** or **session attach/worktree finalization**?
5. How much of the current evidence-lock / parity track should influence the 1.0 release path?
6. Which external capabilities should be selectively assimilated next without collapsing back into parity theater?

---

## Appendix A — Router inventory snapshot

The following `packages/core/src/routers/` files indicate a very wide real feature surface already exists in code:

- agent / autonomy / director / council / swarm / squads
- api keys / oauth / billing / browser / commands / config / context
- deer-flow / open-webui / cloud-dev / marketplace / research / rag
- git / graph / logs / metrics / health / system / startup
- MCP-specific routers including servers, preferences, tools, tool sets, search, policies
- memory and agent memory routes
- supervisor / session / tests / workflow / project / settings

This means Borg is **not missing product surface area**.

It is mainly missing:

- sharper sequencing
- clearer truth boundaries
- more runtime verification on key paths

---

## Appendix B — Dashboard route inventory snapshot

Current dashboard route directories include:

- `agents`, `architecture`, `audit`, `autopilot`, `billing`, `brain`, `browser`, `chronicle`
- `cloud-dev`, `code`, `command`, `config`, `context`, `council`
- `deer-flow`, `director`, `events`, `evolution`, `experts`
- `health`, `infrastructure`, `ingestion`, `inspector`, `intake`, `integrations`
- `jules`, `knowledge`, `library`, `logs`, `manual`, `marketplace`
- `mcp`, `memory`, `metrics`, `plans`, `project`, `providers`, `pulse`
- `reader`, `research`, `security`, `session`, `settings`, `skills`, `squads`
- `submodules`, `super-assistant`, `supervisor`, `swarm`, `symbols`, `system`, `tests`, `webui`, `workflows`, `workshop`

This breadth should be treated as evidence of **capability ambition**, not automatic proof that every page is equally mature.

---

## Bottom line

Borg is already far enough along that the wrong move now is **more uncontrolled expansion**.

The right move is:

- finish the 1.0 trust story
- repair canonical documentation truth
- close MCP/session operator reliability gaps
- keep broad experimental surfaces explicitly marked as such
- preserve the long-term vision without letting it trample the release path

If multiple frontier models are debating the roadmap from here, they should be debating **sequencing and scope control**, not whether Borg needs more ideas. It already has plenty of ideas. It needs the most important ones to become boringly dependable.
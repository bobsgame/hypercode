# Borg OS: Frontend-Backend Feature Gap Analysis — 2026-02-24

## ⚠️ Executive Summary
A cross-referencing of `packages/core/src/routers/*.ts` against `apps/web/src/app/dashboard/` has identified several critical backend services that lack user interface representation. These "dark features" are functional but inaccessible to the end-user via the dashboard.

## 📊 Identified Gaps (High Priority)

### 1. Mesh Control Center (`meshRouter.ts`)
- **Status**: Backend ready (Hyperswarm / Secret-Stream).
- **Missing UI**: No dashboard page to monitor P2P node connections, peer discovery, or node-to-node RPC status.
- **Impact**: Users cannot visualize the "AI Hive Mind" connectivity.

### 2. Semantic Browser Interface (`browserRouter.ts`)
- **Status**: Backend ready.
- **Missing UI**: No dashboard page for controlling or monitoring headless browser sessions.
- **Impact**: "Computer Use" capabilities are limited to terminal-driven macros.

## 📉 Secondary Gaps (Refinement Needed)
- **Policies & Audit**: These exist under `/dashboard/mcp/` but need verification for full feature parity with backend stubs (e.g. Audit event types).
- **Symbol Explorer**: `symbolsRouter.ts` has no `/dashboard/symbols` page.

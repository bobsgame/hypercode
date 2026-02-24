# Borg OS: Frontend-Backend Feature Gap Analysis — 2026-02-24

## ⚠️ Executive Summary
A cross-referencing of `packages/core/src/routers/*.ts` against `apps/web/src/app/dashboard/` has identified several critical backend services that lack user interface representation. These "dark features" are functional but inaccessible to the end-user via the dashboard.

## 📊 Identified Gaps (High Priority)

### 1. Mesh Control Center (`meshRouter.ts`)
- **Status**: Backend ready (Hyperswarm / Secret-Stream).
- **Missing UI**: No dashboard page to monitor P2P node connections, peer discovery, or node-to-node RPC status.
- **Impact**: Users cannot visualize the "AI Hive Mind" connectivity.

### 2. Security & Policy Manager (`policiesRouter.ts`)
- **Status**: Backend ready.
- **Missing UI**: No interface to manage "Allowed/Blocked" commands or file paths.
- **Impact**: Security configurations must be handled via raw JSON or terminal.

### 3. Audit & Compliance Logs (`auditRouter.ts`)
- **Status**: Backend ready.
- **Missing UI**: No visualization for session audit logs or event history.
- **Impact**: Difficult to troubleshoot agent behavior or verify compliance.

### 4. Semantic Browser Interface (`browserRouter.ts`)
- **Status**: Backend ready.
- **Missing UI**: No dashboard page for controlling or monitoring headless browser sessions.
- **Impact**: "Computer Use" capabilities are limited to terminal-driven macros.

## 📉 Secondary Gaps (Developer Experience)
- **Symbol Explorer**: `symbolsRouter.ts` has no `/dashboard/symbols` page.
- **LSP Status**: `lspRouter.ts` lacks a health/status dashboard.
- **Namespace Management**: `namespacesRouter.ts` lacks a UI for managing resource isolation.

## 🛠️ Recommendations
1. **Immediate Sprint**: Implement `/dashboard/mesh` and `/dashboard/policies` to support Phase 64 (Release Readiness).
2. **Reference Implementation**: Use the logic found in `external/mcp-routers/mcp-proxy` as a UI template for the Mesh control center.

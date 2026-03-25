# Handoff — Gemini 2.0 Flash Session

## Session Date: 2026-03-24

## Sprint Status: Phase O Initialization (v0.99.6)

### Completed This Session
1.  **Port 3847 Harmonization**: Standardized the `BORG_ORCHESTRATOR_PORT` to `3847` across the monorepo (`packages/ui`, `apps/web`, `apps/maestro`). This resolved persistent `ERR_CONNECTION_REFUSED` errors from legacy port 3001 references.
2.  **tRPC SSE for Extensions**: Implemented `TRPCProvider.tsx` in `packages/claude-mem` with `unstable_httpSubscriptionLink` and `splitLink`. This allows extension webviews to handle tRPC subscriptions over HTTP SSE, bypassing the "Subscriptions unsupported by httpLink" error.
3.  **Storage Access Fallback**: Created `safeStorage` utilities in `packages/claude-mem` and `apps/maestro` that automatically fall back to in-memory storage when `localStorage` is inaccessible, fixing errors in sandboxed extension webviews.
4.  **CI/CD Stabilization**: Restored GitHub frontpage "Green" status by resolving linting and type errors in `apps/maestro` (missing `@types/mdast`, unused `@ts-expect-error` directives, and `agentSessionId` type mismatches in CLI commands).
5.  **README Mad Science**: Restored the iconic "🧪 ALL CAPS MAD SCIENCE" heading to the project root README.
6.  **Ambitious Roadmap Expansion**: Seeded `IDEAS.md` files across all major repositories (`ai`, `core`, `mcp-client`, `ui`, `web`, `maestro`, `borg-extension`) with high-intelligence proposals: Rust micro-kernel, P2P Hive Mind, and Bobcoin integration.
7.  **Documentation Overhaul**: Comprehensively updated `VISION.md`, `ROADMAP.md`, `TODO.md`, and `MEMORY.md` to reflect Phase O goals and the user's ultimate project vision.

### Pending High-Priority Items (Phase O)
- **Finalize Dashboard Data-Binding**: Verify all 59+ pages in `apps/web` are fully wired to real tRPC services (especially brain, chronicle, evolution).
- **Mobile App Hardening**: Link `@borg/mobile` React Native wireframes to real WebSocket/tRPC endpoints for remote monitoring.
- **Audit package.json lockfiles**: Ensure exact version pinning for v1.0.0 release to prevent dependency drift.
- **Submodule Dashboard**: Implement the UI for monitoring and updating submodules directly from the dashboard.

### Operational Context for Next Model
- **Orchestrator Port**: Use `3847` for all orchestrator communication.
- **Extension Webviews**: Always use the `safeStorage` utility instead of raw `localStorage`.
- **Subscriptions**: Use `unstable_httpSubscriptionLink` for tRPC subscriptions in restricted contexts.
- **Build Gate**: Always run `pnpm run build` in `apps/web` and `apps/maestro` to verify integrity.

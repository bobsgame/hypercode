# Claude-Specific Instructions

> **CRITICAL MANDATE: READ `docs/UNIVERSAL_LLM_INSTRUCTIONS.md` FIRST.**
> This file contains only Claude-specific overrides.

## 1. Claude's Role: The Senior Engineer & Code Reviewer
Claude excels at deep, methodical, step-by-step logic and rigorous code review. You are the primary engine for safe refactoring, strict type checking, and bug hunting.

## 2. Claude-Specific Strengths
*   **Methodical Planning:** You write robust, step-by-step plans in `TODO.md` before executing complex refactors.
*   **Nuance & Syntax:** You catch subtle TypeScript errors and edge cases that other models miss.
*   **Documentation:** You write incredibly clear, polished markdown documentation and UI text.

## 3. Workflow Checklist
1.  Read `docs/UNIVERSAL_LLM_INSTRUCTIONS.md`.
2.  Review `VERSION`, `CHANGELOG.md`, `ROADMAP.md`, `TODO.md`, and `MEMORY.md`.
3.  Execute your task carefully, writing tests where appropriate.
4.  Commit, push, bump the version, and write a detailed `HANDOFF.md`.

## 4. Key Operational Notes
*   **Build Gate:** Always verify with `pnpm run build` in `apps/web` — dev mode hides import errors.
*   **Import Rule:** `apps/web` imports from `@borg/ui`, never `@/components/ui/*`.
*   **MCP Config:** `~/.borg/mcp.json`. See `AGENTS.md` §Operational Context for details.


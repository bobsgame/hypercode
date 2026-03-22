# GPT-Specific Instructions

> **CRITICAL MANDATE: READ `docs/UNIVERSAL_LLM_INSTRUCTIONS.md` FIRST.**
> This file contains only GPT-specific overrides.

## 1. GPT's Role: The Rapid Implementer
GPT models are excellent for rapid scaffolding, shell scripting, regex generation, and writing boilerplate.

## 2. GPT-Specific Strengths
*   **Rapid Generation:** You write fast, functional code.
*   **Tool Usage:** You are highly proficient at using CLI tools, shell commands, and regex.

## 3. Workflow Checklist
1.  Read `docs/UNIVERSAL_LLM_INSTRUCTIONS.md`.
2.  Review `VERSION`, `CHANGELOG.md`, `ROADMAP.md`, `TODO.md`, and `MEMORY.md`.
3.  Perform task rapidly. Check for regressions.
4.  Commit, push, bump version, and handoff.

## 4. Key Operational Notes
*   **Build Gate:** Verify with `pnpm run build` in `apps/web` after UI changes.
*   **Import Rule:** `apps/web` imports from `@borg/ui`, never `@/components/ui/*`.
*   **MCP Config:** `~/.borg/mcp.json`. See `AGENTS.md` §Operational Context.


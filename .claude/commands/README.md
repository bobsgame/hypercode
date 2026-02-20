# Local Slash Commands

This folder contains project-local Claude slash commands.

## Commands

- `/codex-root-cause` — Full read-only Codex root-cause workflow
- `/codex` — Short alias for Codex root-cause investigation
- `/codex-investigate` — Alternate alias emphasizing investigation workflow
- `/codex-implement` — Apply fix after analysis, then validate
- `/codex-recheck` — Run a narrower second-pass Codex diagnosis

## Notes

- Codex analysis commands here are intentionally **read-only**.
- Use them to diagnose root causes; apply fixes in normal coding flow afterward.

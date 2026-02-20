---
description: Re-run focused Codex root-cause check when first diagnosis is inconclusive
---

# Codex Recheck (Focused Follow-up)

Use this command when initial Codex analysis is incomplete, conflicting, or too broad.

## Purpose

- Ask a **narrower, higher-signal** follow-up question
- Include only decisive context (file:line, actual errors, failed attempts)
- Get a tighter root-cause and fix strategy

## Workflow

1. Capture what was unclear in prior analysis (1-3 bullets).
2. Build a sharper prompt with:
   - Exact failing behavior
   - Concrete file/line references
   - Minimal relevant snippet(s)
   - One focused question
3. Execute Codex in read-only mode:

`codex exec -m gpt-5 -c model_reasoning_effort="high" --sandbox read-only "Your focused prompt"`

4. Return:
   - Updated root cause
   - Why prior diagnosis was insufficient
   - Revised fix approach

## Guardrails

- Keep prompt concise; avoid dumping full files.
- Always use `--sandbox read-only`.
- Prefer one sharply scoped question over many broad ones.

## Output format

```text
## Codex Recheck

- Updated root cause: [...]
- Why prior result missed it: [...]
- Revised fix path: [...]
```

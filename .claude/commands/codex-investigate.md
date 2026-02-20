---
description: Investigate bugs with Codex in read-only mode (alias)
---

# Codex Investigate (Alias)

This is a convenience alias for the `/codex-root-cause` workflow.

## What it does

- Builds a focused bug investigation prompt from current context
- Runs Codex with **read-only** sandboxing
- Returns actionable root-cause analysis + concise summary

## Required command format

`codex exec -m gpt-5 -c model_reasoning_effort="high" --sandbox read-only "Your debug prompt here"`

## Safety

- Always use `--sandbox read-only`
- Do not allow file edits from this command
- Keep context focused (bug + file/line + attempted fixes)

## Response shape

```text
## Codex Analysis

[Codex output]

---

Summary: [2-3 sentence summary]
Next steps: [implement fix or investigate further]
```

After analysis, implementation is done by you (the agent), not by Codex via this command.
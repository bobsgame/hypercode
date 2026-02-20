---
description: Short alias for Codex root cause analysis (read-only, no edits)
---

# Codex Investigation (Alias)

Use this command as a shorthand for the full root-cause workflow in `/codex-root-cause`.

## Behavior

- Build a focused bug-investigation prompt from the current conversation context.
- Run Codex in **read-only** mode.
- Return only the useful analysis, plus a concise summary and next-step recommendation.

## Required execution format

`codex exec -m gpt-5 -c model_reasoning_effort="high" --sandbox read-only "Your debug prompt here"`

## Safety constraints

- Always include `--sandbox read-only`.
- Do not let Codex edit files from this command.
- Keep prompts focused to relevant files/lines and attempted fixes.

## Output format

```text
## Codex Analysis

[Codex response]

---

Summary: [2-3 sentence summary]
Next steps: [implement fix or investigate further]
```

If the user wants implementation, proceed to implement yourself after analysis.
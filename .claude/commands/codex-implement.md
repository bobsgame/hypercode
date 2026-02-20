---
description: Implement a fix after Codex analysis, then validate with tests/typecheck
---

# Codex Implement (Post-Analysis)

Use this command after `/codex-root-cause` (or its aliases) when the user wants to apply the fix.

## Purpose

- Convert root-cause analysis into a minimal, safe implementation plan
- Apply focused code changes
- Validate via relevant checks/tests
- Report exactly what changed and how it was verified

## Workflow

1. **Restate target fix** from the latest Codex analysis in 1-2 bullets.
2. **Locate files/symbols** and confirm scope before editing.
3. **Implement minimal patch** (avoid unrelated refactors).
4. **Run validation**:
   - Typecheck/lint for affected package
   - Targeted test(s) if available
   - Smoke run if no tests exist
5. **Summarize outcome**:
   - Root cause fixed (yes/no)
   - Files changed
   - Validation evidence
   - Remaining risks/follow-ups

## Guardrails

- Preserve public APIs unless explicitly asked to change them.
- Prefer smallest correct diff.
- If uncertainty remains, add a narrow diagnostic test before broad changes.
- Do not claim success without validation output.

## Output format

```text
## Implementation Summary

- Fix applied: [short statement]
- Files changed: [list]
- Validation: [typecheck/tests results]
- Risk/Follow-up: [if any]
```

---
description: Query OpenAI Codex for root cause analysis (read-only, no edits)
---

# Codex Root Cause Investigation

You are Claude Code, and the user wants to consult OpenAI Codex (via codex CLI) for root cause analysis of a bug or technical issue.

## Your Task

1. **Understand the context** from the user's query and conversation history.
2. **Create a focused debug prompt** for Codex that includes:
   - Clear description of the issue/bug
   - Relevant code locations (`file:line`)
   - What has already been tried
   - Specific question Codex should answer
3. **Execute Codex in read-only mode** (no file edits allowed).
4. **Present Codex analysis** back to the user.

## Important: Codex Exec Command Format

Use this exact format:

`codex exec -m gpt-5 -c model_reasoning_effort="high" --sandbox read-only "Your debug prompt here"`

### Flags

- `exec` → one-shot non-interactive mode
- `-m gpt-5` → model selection (can also use `gpt-5-codex`)
- `-c model_reasoning_effort="high"` → deep reasoning (`low`, `medium`, `high`)
- `--sandbox read-only` → **critical** safety guard; analysis only, no edits

## Debug Prompt Template

Use this structure when preparing the Codex prompt:

```text
# Bug Investigation Request

## Issue
[Brief description of the bug/problem]

## Context
- File(s): path/to/file:lineNumber
- What's happening: [observed behavior]
- Expected behavior: [desired behavior]
- What we've tried: [attempted fixes]

## Code Snippet
[Concise relevant snippet]

## Question
What is the root cause of this issue? Please provide:
1. Root cause analysis
2. Why previous fixes didn't work (if applicable)
3. Suggested fix approach

Keep response focused and actionable.
```

## Execution Steps

1. Build the prompt from current context.
2. Run Codex with the command above in **read-only** mode.
3. Extract only the useful analysis (ignore session boilerplate/token metadata).
4. Summarize findings in plain language.
5. Ask whether the user wants implementation next.

## Output Format

```text
## Codex Analysis

[Codex response]

---

Summary: [2-3 sentence summary]
Next steps: [Ask whether to implement fix or investigate further]
```

## Example

User says: `/codex investigate the paste bug in update_keyboard.go`

You should:
1. Review the bug context.
2. Build a focused prompt with specific file/line details.
3. Run Codex read-only.
4. Return concise analysis + summary.

## Important Notes

- Always use `--sandbox read-only`.
- Keep prompts focused; avoid dumping large files.
- If answer is off-target, rerun with clearer constraints/snippets.
- Codex investigates; **you** implement the fix.

## Troubleshooting

If Codex fails:
- Verify installation (`codex` available on PATH)
- Verify authentication (`codex login`)
- Retry with longer timeout if needed

If analysis quality is low:
- Add concrete file/line context
- Include minimal but relevant snippets
- Ask a narrower question

---

**Remember:** This command is for investigation only. Codex analyzes, you implement.
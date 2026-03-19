# Built-In Tools Evidence Lock

> Date: 2026-03-18  
> Purpose: source-pin every competitor tool contract before declaring parity complete.

## How to Use

For each platform, fill all required fields:

- **Primary source URL** (official docs/repo)
- **Version/commit/date pin**
- **Exact tool names**
- **Parameter schemas**
- **Return payload shape**
- **Approval/permission model**
- **Known caveats**

A platform is only marked **Locked** when all fields are complete and reviewed.

---

## OpenCode — ✅ Locked (repo-sourced)

- Primary source (in-repo): `archive/docs/RESEARCH_COMPETITORS.md`
- Version pin: research snapshot in repo (2026-02 era)
- Exact built-ins captured:
  - `ls(path, recursive)`
  - `grep(pattern, path, include, literal_text)`
  - `read(file_path)`
  - `view(file_path, offset, limit)`
  - `edit(file_path, ...)`
  - `patch(file_path, diff)`
  - `diagnostics(file_path)`
  - `bash(command, timeout)`
  - `fetch(url, format)`
  - `agent(prompt)`
- Permission model captured:
  - Allow once / allow session / deny
  - Non-interactive auto-approve mode
- Caveat:
  - Should still be revalidated against latest upstream release.

---

## GitHub Copilot CLI — 🟡 Partially Locked

- Primary source (in-repo): `archive/docs/RESEARCH_COMPETITORS.md`
- Version pin: research snapshot in repo
- Captured commands:
  - `suggest`
  - `explain`
- Missing for full lock:
  - argument-level schema details
  - machine-readable response shape contract
  - latest release diff verification

---

## Gemini CLI — 🟡 Partially Locked

- Primary source (in-repo): `archive/docs/RESEARCH_COMPETITORS.md`
- Captured capability classes:
  - search grounding
  - file operations
  - shell
  - web fetch
  - trusted folders/policies
- Missing for full lock:
  - exact tool/command names with signatures
  - response schema contracts
  - version-pinned official doc links

---

## Codex CLI — ❌ Unlocked

- Required evidence:
  - official docs + version pin
  - exact built-ins and signatures
  - approval/permission model semantics

## Claude Code — ❌ Unlocked

- Required evidence:
  - official docs + version pin
  - exact built-ins and signatures
  - approval/permission model semantics

## Cursor — ❌ Unlocked

- Required evidence:
  - official docs + version pin
  - exact built-ins and signatures
  - approval/permission model semantics

## VS Code + Copilot IDE Agent — ❌ Unlocked

- Required evidence:
  - official docs + version pin
  - exact built-ins and signatures
  - approval/permission model semantics

## Windsurf — ❌ Unlocked

- Required evidence:
  - official docs + version pin
  - exact built-ins and signatures
  - approval/permission model semantics

## Kiro — ❌ Unlocked

- Required evidence:
  - official docs + version pin
  - exact built-ins and signatures
  - approval/permission model semantics

## Antigravity — ❌ Unlocked

- Required evidence:
  - official docs + version pin
  - exact built-ins and signatures
  - approval/permission model semantics

---

## Borg Readiness Gate

Do not claim “first-class parity complete” until:

- [ ] All target platforms are **Locked**
- [ ] Golden fixtures exist for tool call/response compatibility
- [ ] Alias profiles pass CI
- [ ] Permission model equivalence tests pass
- [ ] Change log includes parity delta per release

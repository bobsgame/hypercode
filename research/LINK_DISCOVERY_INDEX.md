# Link Discovery & Assimilation Index

This file tracks high-value resources discovered during the backlog processing (2026-02-24). These resources are being systematically indexed and assimilated into the Borg AIOS.

---

## 🚀 Newly Added Submodules

| Submodule | Path | Category | Star Count | Key Features |
|-----------|------|----------|------------|--------------|
| [awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit) | `references/awesome-claude-code-toolkit` | Toolkit | 532 | 135 Agents, 121 Plugins, 35 Skills, 42 Commands |
| [awesome-claude-code-plugins](https://github.com/ccplugins/awesome-claude-code-plugins) | `references/awesome-claude-code-plugins` | Plugins | 482 | Curated list of slash commands and hooks |
| [claude_code-gemini-mcp](https://github.com/RaiAnsar/claude_code-gemini-mcp) | `references/claude_code-gemini-mcp` | MCP Bridge | 240 | Simplified Gemini bridge for Claude |
| [gemini-mcp-r-labs](https://github.com/RLabs-Inc/gemini-mcp) | `references/gemini-mcp-r-labs` | MCP Bridge | 134 | Rich Gemini 3 integration for Claude |

---

## 🎯 Assimilation Targets (High Priority)

### 1. Skills (From `awesome-claude-code-toolkit`)
- [ ] **TDD Mastery**: Advanced red-green-refactor patterns.
- [ ] **Security Hardening**: Input validation and secrets management.
- [ ] **API Design Patterns**: RESTful conventions and OpenAPI.
- [ ] **Database Optimization**: Query planning and indexing.
- [ ] **DevOps Automation**: IaC and GitOps scripts.

### 2. Agents (Persona Integration)
- [ ] **Cloud Architect**: Integration with Borg's infrastructure layer.
- [ ] **Security Auditor**: Porting OWASP checks to Borg's `security_engineer`.
- [ ] **Database Admin**: Porting query tuning to `data_engineer`.

### 3. Commands (Porting to `.claude/commands`)
- [ ] `/audit`: Full security audit.
- [ ] `/smart-commit`: Convention-compliant commits.
- [ ] `/diagram`: Mermaid generation.

---

## 🔍 Discovery Research Log

### 2026-02-24: The "Gold Mine" Session
- Successfully added four high-value submodules totaling over 1,300 stars.
- Identified `awesome-claude-code-toolkit` as the primary source for Phase 65-69 assimilation.
- Research confirmed that "Spec-Flow" and "Claude-Code" formats are highly compatible with Borg's existing architecture.

### Next Research Steps
- [ ] Explore `references/awesome-claude-code-plugins/README.md`.
- [ ] Compare `RaiAnsar` vs `RLabs` Gemini bridges for efficiency improvements in `LLMService`.

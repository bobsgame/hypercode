# Borg Memory System Architecture

> **Version**: 2.7.32 (Phase 74)
> **Status**: Multi-Backend (LanceDB + ChromaDB + Pinecone) — Production Ready

---

## 1. Overview

The Memory System is the "Long-Term Potentiation" layer of the Neural Operating System. It allows Borg to retain context, learn from past interactions, and "know" the user and project without re-reading every file.

It allows agents (Director, Coder, Researcher, SwarmOrchestrator) to:
1. **Store** entities, facts, and code snippets.
2. **Recall** relevant information based on semantic query.
3. **Refine** knowledge over time (consolidation).
4. **Export/Import** memory across sessions (JSON, CSV, JSONL).

## 2. Architecture

### 2.1 The Memory Manager (`packages/memory`)
The core interface `MemoryManager` abstracts the underlying storage.

```typescript
interface MemoryManager {
    saveContext(content: string, metadata?: any): Promise<void>;
    search(query: string, limit: number): Promise<MemoryResult[]>;
    getGraph(): Promise<KnowledgeGraph>;
    exportMemory(format: 'json' | 'csv' | 'jsonl'): Promise<Buffer>;
    importMemory(data: Buffer, format: string): Promise<void>;
}
```

### 2.2 Storage Tiers

| Tier | Technology | Purpose | Status |
|------|------------|---------|--------|
| **Short-Term** | In-Memory (Map) | Active session context, recent messages. | ✅ Active |
| **Episodic** | SQLite / Postgres | Time-series log of actions and outcomes. | ✅ Active |
| **Semantic** | LanceDB / ChromaDB / Pinecone | Embedding-based retrieval of concepts. | ✅ Multi-Backend (Phase 70) |
| **Graph** | Graphology | Relationship mapping (File A imports File B). | ✅ Active |

## 3. Integrated Backends

### 3.1 Native Multi-Backend (Phase 70)
Selectable vector store backends via configuration:
- **LanceDB** (default) — Local, zero-config, embedded
- **ChromaDB** — Self-hosted or cloud, HTTP API
- **Pinecone** — Managed cloud service, enterprise-grade

### 3.2 RAG Pipeline (Phase 71)
- **Document Intake**: PDF, DOCX, Markdown ingestion via `DocumentIntakeService`
- **Chunking Strategies**: Semantic, sliding window, recursive
- **Embedding Service**: Abstraction over OpenAI, local models

### 3.3 claude-mem (`packages/claude-mem`)
- **Type**: Context & Memory Management
- **Features**: Claude-specific structural memory implementation.
- **Integration**: Integrated into Borg's `RedundantMemoryManager` for multi-store writes.

### 3.4 Memora (`external/memory/memora`)
- **Type**: MCP Server (Python)
- **Features**: Semantic storage, Knowledge Graphs, SQLite persistence with cloud sync (S3/R2/D1).

### 3.5 Papr Memory (`external/memory/memory-opensource`)
- **Type**: Predictive Memory Layer (FastAPI)
- **Features**: MongoDB + Qdrant + Neo4j stack, Predictive retrieval, custom ontologies.

## 4. Current Implementation (v2.7.32)

- **Vector Store**: Multi-backend via `MemoryBackendSelector` (LanceDB default)
- **Knowledge Service**: `KnowledgeService.ts` manages graph structure
- **Memory Export/Import**: `MemoryExportImportService.ts` (JSON, CSV, JSONL)
- **Routers**: `memoryRouter`, `knowledgeRouter`, `agentMemoryRouter` expose these via tRPC

## 5. Integration Guide

### Usage in Agents
```typescript
// Storing a finding
await memoryManager.saveContext("User prefers Tailwind over CSS modules", { type: "preference" });

// Recalling info
const relevant = await memoryManager.search("css preference", 1);
// Result: "User prefers Tailwind..."
```

### Usage in MCP
Use the `knowledge-store` tool exposed by `mcpRouter` to save/retrieve information naturally.

---

## 6. Roadmap

- [x] **Multi-Backend Plugin System**: Swap LanceDB for ChromaDB/Pinecone via config (Phase 70)
- [x] **Automatic Harvesting**: Document intake pipeline for PDFs, DOCX, Markdown (Phase 71)
- [ ] **Graph Visualization**: Interactive 3D force graph in Dashboard
- [ ] **Context Window Optimization**: "Smart Context" that injects only relevant memories into the LLM prompt

---

*"I remember everything."*

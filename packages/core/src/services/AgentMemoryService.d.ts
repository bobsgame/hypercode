/**
 * Agent Memory Service - Tiered Memory System for Persistent Agent Context
 *
 * Implements multi-tier memory architecture inspired by Mem0 and Letta:
 * - Session Memory: Ephemeral context within a conversation
 * - Working Memory: Task-relevant facts extracted during execution
 * - Long-term Memory: Persistent learnings across sessions
 *
 * Features:
 * - Automatic memory extraction from conversations
 * - Relevance-based retrieval with temporal decay
 * - User/Agent/Project namespaces
 * - Memory consolidation (working -> long-term)
 */
import { MemoryManager } from './MemoryManager.js';
export type MemoryType = 'session' | 'working' | 'long_term';
export type MemoryNamespace = 'user' | 'agent' | 'project';
export interface Memory {
    id: string;
    type: MemoryType;
    namespace: MemoryNamespace;
    content: string;
    media?: MemoryMedia[];
    metadata: MemoryMetadata;
    createdAt: Date;
    accessedAt: Date;
    accessCount: number;
    score?: number;
    ttl?: number;
}
export interface MemoryMedia {
    type: 'image' | 'audio' | 'video' | 'file';
    url?: string;
    dataUrl?: string;
    blobHash?: string;
    mimeType?: string;
    description?: string;
}
export interface MemoryMetadata {
    source?: string;
    tags?: string[];
    relatedMemories?: string[];
    confidence?: number;
    userId?: string;
    projectId?: string;
    sessionId?: string;
    [key: string]: unknown;
}
export interface MemorySearchOptions {
    namespace?: MemoryNamespace;
    type?: MemoryType;
    limit?: number;
    minScore?: number;
    tags?: string[];
    includeExpired?: boolean;
}
export interface MemoryServiceOptions {
    persistDir: string;
    sessionTTL?: number;
    consolidationThreshold?: number;
    maxSessionMemories?: number;
    maxWorkingMemories?: number;
}
/**
 * Simple in-memory vector similarity using TF-IDF-like approach
 * Production would use proper embeddings
 */
/**
 * Agent Memory Service - Main service class
 */
export declare class AgentMemoryService {
    private memories;
    private memoryManager;
    private options;
    private dirty;
    constructor(options: MemoryServiceOptions, memoryManager?: MemoryManager);
    /**
     * Generate unique memory ID
     */
    private generateId;
    /**
     * Load memories from disk
     */
    private loadFromDisk;
    /**
     * Save memories to disk
     */
    private saveToDisk;
    /**
     * Add a memory
     */
    add(content: string, type: MemoryType, namespace: MemoryNamespace, metadata?: MemoryMetadata): Promise<Memory>;
    /**
     * Get a memory by ID
     */
    get(id: string): Memory | null;
    /**
     * Delete a memory
     */
    delete(id: string): Promise<boolean>;
    /**
     * Search memories using hybrid strategy (Local sessions + Vector DB)
     */
    search(query: string, options?: MemorySearchOptions): Promise<Memory[]>;
    /**
     * Get recent memories
     */
    getRecent(limit?: number, options?: MemorySearchOptions): Memory[];
    /**
     * Add session memory (ephemeral)
     */
    addSession(content: string, metadata?: MemoryMetadata): Promise<Memory>;
    /**
     * Add working memory (task-relevant)
     */
    addWorking(content: string, namespace?: MemoryNamespace, metadata?: MemoryMetadata): Promise<Memory>;
    /**
     * Add long-term memory (persistent)
     */
    addLongTerm(content: string, namespace?: MemoryNamespace, metadata?: MemoryMetadata): Promise<Memory>;
    /**
     * Check if memory should be consolidated to long-term
     */
    private checkConsolidation;
    /**
     * Enforce memory limits by removing old memories
     */
    private enforceMemoryLimits;
    /**
     * Get memories by type
     */
    getByType(type: MemoryType): Memory[];
    /**
     * Get memories by namespace
     */
    getByNamespace(namespace: MemoryNamespace): Memory[];
    /**
     * Clear all session memories
     */
    clearSession(): void;
    /**
     * Get memory statistics
     */
    getStats(): Record<string, number>;
    /**
     * Export memories to JSON
     */
    export(): string;
    /**
     * Import memories from JSON
     */
    import(jsonData: string): Promise<number>;
    /**
     * Schedule auto-save
     */
    private saveTimeout;
    private scheduleSave;
    /**
     * Force save to disk
     */
    flush(): void;
    /**
     * Shutdown and save
     */
    shutdown(): void;
}
export default AgentMemoryService;

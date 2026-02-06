import { SearchResult } from '../interfaces/VectorProvider.js';
import { PruningOptions } from './ContextPruner.js';
import type { GraphMemory } from '@borg/memory';
export declare class MemoryManager {
    private provider;
    private pruner;
    private initialized;
    private dbPath;
    private registryPath;
    graph: GraphMemory | null;
    constructor(workspaceRoot?: string);
    private initialize;
    saveContext(content: string, metadata?: any): Promise<string>;
    search(query: string, limit?: number): Promise<SearchResult[]>;
    searchSymbols(query: string, limit?: number): Promise<SearchResult[]>;
    getAllSymbols(): Promise<any[]>;
    /**
     * Index structured symbols (Classes, Functions) using AST parsing.
     */
    indexSymbols(rootDir: string): Promise<number>;
    indexCodebase(rootDir: string): Promise<number>;
    getContext(id: string): Promise<SearchResult | null>;
    deleteContext(id: string): Promise<void>;
    listContexts(): Promise<any>;
    private addToRegistry;
    private removeFromRegistry;
    /**
     * Infinite Context V3: Prune a conversation history to fit within limits.
     */
    pruneContext(messages: any[], options?: Partial<PruningOptions>): any[];
    /**
     * Calculate token usage for observability
     */
    getContextSize(messages: any[]): number;
}

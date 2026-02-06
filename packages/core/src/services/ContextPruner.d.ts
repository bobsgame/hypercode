/**
 * ContextPruner
 *
 * Handles strict token management for infinite context windows.
 * Implements a "Sliding Window + Landmark" strategy:
 * 1. Always keep System Prompt (first message).
 * 2. Always keep last N messages (Recency Buffer).
 * 3. Prune middle messages based on relevance/importance (or FIFO if no relevance metadata).
 * 4. Summarize dropped segments (future).
 */
export interface PruningOptions {
    maxTokens: number;
    keepLast: number;
    keepFirst: number;
    estimatedTokensPerChar?: number;
}
export declare class ContextPruner {
    private options;
    constructor(options?: Partial<PruningOptions>);
    /**
     * Estimates token count for a list of messages.
     */
    estimateTokens(messages: any[]): number;
    /**
     * Prunes messages to fit within maxTokens.
     * Returns the pruned list of messages.
     */
    prune(messages: any[]): any[];
}

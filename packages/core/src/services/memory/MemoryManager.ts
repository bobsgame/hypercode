import { IMemoryProvider, Memory } from '../../interfaces/IMemoryProvider.js';
import { JsonMemoryProvider } from './JsonMemoryProvider.js';

export class MemoryManager implements IMemoryProvider {
    private provider: IMemoryProvider;

    constructor(workspaceRoot: string, providerType: 'json' | 'postgres' = 'json') {
        // TODO: Switch based on providerType or config
        // For now, default to JSON
        this.provider = new JsonMemoryProvider(workspaceRoot);
    }

    async init(): Promise<void> {
        await this.provider.init();
    }

    async saveMemory(content: string, metadata: Record<string, any>, userId: string, agentId?: string): Promise<Memory> {
        return this.provider.saveMemory(content, metadata, userId, agentId);
    }

    async searchMemories(query: string, userId: string, limit?: number, threshold?: number): Promise<Memory[]> {
        return this.provider.searchMemories(query, userId, limit, threshold);
    }

    async listMemories(userId: string, limit?: number, offset?: number): Promise<Memory[]> {
        return this.provider.listMemories(userId, limit, offset);
    }

    async deleteMemory(uuid: string, userId: string): Promise<void> {
        return this.provider.deleteMemory(uuid, userId);
    }
}

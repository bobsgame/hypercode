import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';
import { RepoGraphService } from '../services/RepoGraphService.js';

// Lazy-initialized graph service (initialized on first call)
let graphService: RepoGraphService | null = null;

function getGraphService(): RepoGraphService {
    if (!graphService) {
        // @ts-ignore - global.mcpServerInstance may have autoTestService with repoGraph
        if (global.mcpServerInstance?.autoTestService?.repoGraph) {
            // @ts-ignore
            graphService = global.mcpServerInstance.autoTestService.repoGraph;
        } else {
            // Fallback: create standalone instance
            graphService = new RepoGraphService(process.cwd());
        }
    }
    return graphService!;
}

export const graphRouter = t.router({
    getGraph: publicProcedure.query(async () => {
        const service = getGraphService();
        if (!service) {
            return { nodes: [], links: [] };
        }
        // Build graph if not initialized
        // @ts-ignore - isInitialized is private but we check it for optimization
        if (!service['isInitialized']) {
            await service.buildGraph();
        }
        return service.toJSON();
    }),

    rebuild: publicProcedure.mutation(async () => {
        const service = getGraphService();
        await service.buildGraph();
        return { success: true, ...service.toJSON() };
    }),

    getConsumers: publicProcedure
        .input(z.object({ filePath: z.string() }))
        .query(({ input }) => {
            const service = getGraphService();
            return service.getConsumers(input.filePath);
        }),

    getDependencies: publicProcedure
        .input(z.object({ filePath: z.string() }))
        .query(({ input }) => {
            const service = getGraphService();
            return service.getDependencies(input.filePath);
        }),
});

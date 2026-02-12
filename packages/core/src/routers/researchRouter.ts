import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';
import { getMcpServer } from '../lib/mcpHelper.js';

export const researchRouter = t.router({
    conduct: publicProcedure
        .input(z.object({
            topic: z.string(),
            depth: z.number().min(1).max(10).default(3)
        }))
        .mutation(async ({ input }) => {
            const mcp = getMcpServer();
            if (!mcp) throw new Error("MCP Server not found");

            const service = (mcp as any).researchService;
            const report = await service.research(input.topic, input.depth);
            return { report };
        })
});


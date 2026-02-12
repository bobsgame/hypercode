
import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';
import { getMcpServer } from '../lib/mcpHelper.js';

export const pulseRouter = t.router({
    getLatestEvents: publicProcedure
        .input(z.object({
            limit: z.number().default(20),
            afterTimestamp: z.number().optional()
        }))
        .query(async ({ input }) => {
            const mcp = getMcpServer();
            if (!mcp || !mcp.eventBus) return [];

            const history = mcp.eventBus.getHistory(input.limit);

            if (input.afterTimestamp) {
                return history.filter(e => e.timestamp > input.afterTimestamp!);
            }

            return history;
        }),

    getSystemStatus: publicProcedure.query(async () => {
        const mcp = getMcpServer();
        if (!mcp) return { status: 'offline' };

        return {
            status: 'online',
            uptime: process.uptime(),
            agents: Array.from(mcp.activeAgentsMap?.keys() || []),
            memoryInitialized: mcp.isMemoryInitialized
        };
    })
});


import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';
import { SystemEvent } from '../services/EventBus.js';

export const pulseRouter = t.router({
    getLatestEvents: publicProcedure
        .input(z.object({
            limit: z.number().default(20),
            afterTimestamp: z.number().optional()
        }))
        .query(async ({ input }) => {
            // @ts-ignore
            const mcp = global.mcpServerInstance;
            if (!mcp || !mcp.eventBus) return [];

            // Hack: Since EventBus is transient, we can't query persistent history unless we store it.
            // For now, let's assume valid "latest" are just buffered or we just return nothing if no history service.
            // Wait, an EventBus is ephemeral. If UI polls, it misses events between polls.
            // We need a small buffer in EventBus or a PulseService.

            // Let's rely on a PulseService if we wanted persistence.
            // But for Phase 30, let's just inspect active state.

            // Actually, let's look at `mcp.activeAgents` or similar.

            return [];
        }),

    getSystemStatus: publicProcedure.query(async () => {
        // @ts-ignore
        const mcp = global.mcpServerInstance;
        if (!mcp) return { status: 'offline' };

        return {
            status: 'online',
            uptime: process.uptime(),
            agents: Array.from(mcp.activeAgents?.keys() || []),
            memoryInitialized: mcp.memoryInitialized
        };
    })
});

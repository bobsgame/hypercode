import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';

export const councilRouter = t.router({
    runSession: publicProcedure.input(z.object({ proposal: z.string() })).mutation(async ({ input }) => {
        // @ts-ignore
        if (global.mcpServerInstance) {
            // @ts-ignore
            const result = await global.mcpServerInstance.council.runConsensusSession(input.proposal);
            return result;
        }
        throw new Error("MCPServer instance not found");
    }),
    getLatestSession: publicProcedure.query(async () => {
        // @ts-ignore
        if (global.mcpServerInstance) {
            // @ts-ignore
            return global.mcpServerInstance.council.lastResult || null;
        }
    }),
    listSessions: publicProcedure.query(async () => {
        // @ts-ignore
        if (global.mcpServerInstance && global.mcpServerInstance.councilService) {
            // @ts-ignore
            return global.mcpServerInstance.councilService.listSessions();
        }
        return [];
    }),
    getSession: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
        // @ts-ignore
        if (global.mcpServerInstance && global.mcpServerInstance.councilService) {
            // @ts-ignore
            return global.mcpServerInstance.councilService.getSession(input.id);
        }
        return null;
    })
});

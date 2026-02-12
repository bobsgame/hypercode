import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';
import { getMcpServer } from '../lib/mcpHelper.js';

export const autoDevRouter = t.router({
    startLoop: publicProcedure.input(z.object({
        type: z.enum(['test', 'lint', 'build']),
        maxAttempts: z.number().min(1).max(10).default(5),
        target: z.string().optional(),
        command: z.string().optional()
    })).mutation(async ({ input }) => {
        const mcp = getMcpServer();
        if ((mcp as any)?.autoDevService) {
            const id = await (mcp as any).autoDevService.startLoop(input);
            return { success: true, loopId: id };
        }
        throw new Error('AutoDevService not initialized');
    }),

    cancelLoop: publicProcedure.input(z.object({
        loopId: z.string()
    })).mutation(({ input }) => {
        const mcp = getMcpServer();
        if ((mcp as any)?.autoDevService) {
            return (mcp as any).autoDevService.cancelLoop(input.loopId);
        }
        return false;
    }),

    getLoops: publicProcedure.query(() => {
        const mcp = getMcpServer();
        if ((mcp as any)?.autoDevService) {
            return (mcp as any).autoDevService.getLoops();
        }
        return [];
    }),

    getLoop: publicProcedure.input(z.object({
        loopId: z.string()
    })).query(({ input }) => {
        const mcp = getMcpServer();
        if ((mcp as any)?.autoDevService) {
            return (mcp as any).autoDevService.getLoop(input.loopId);
        }
        return null;
    }),

    clearCompleted: publicProcedure.mutation(() => {
        const mcp = getMcpServer();
        if ((mcp as any)?.autoDevService) {
            return (mcp as any).autoDevService.clearCompleted();
        }
        return 0;
    }),
});


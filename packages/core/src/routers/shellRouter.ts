import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';
import { getMcpServer } from '../lib/mcpHelper.js';

export const shellRouter = t.router({
    logCommand: publicProcedure.input(z.object({
        command: z.string(),
        cwd: z.string(),
        exitCode: z.number().optional(),
        duration: z.number().optional(),
        outputSnippet: z.string().optional(),
        session: z.string()
    })).mutation(async ({ input }) => {
        const mcp = getMcpServer();
        if (mcp?.shellService) {
            const id = await mcp.shellService.logCommand(input);
            return { success: true, id };
        }
        return { success: false, error: 'ShellService not initialized' };
    }),

    queryHistory: publicProcedure.input(z.object({
        query: z.string(),
        limit: z.number().optional()
    })).query(async ({ input }) => {
        const mcp = getMcpServer();
        if (mcp?.shellService) {
            return mcp.shellService.queryHistory(input.query, input.limit);
        }
        return [];
    }),

    getSystemHistory: publicProcedure.input(z.object({
        limit: z.number().optional()
    })).query(async ({ input }) => {
        const mcp = getMcpServer();
        if (mcp?.shellService) {
            return mcp.shellService.getSystemHistory(input.limit);
        }
        return [];
    })
});


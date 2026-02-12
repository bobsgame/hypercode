import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';
import { getMcpServer } from '../lib/mcpHelper.js';

export const contextRouter = t.router({
    list: publicProcedure.query(() => {
        const mcp = getMcpServer();
        if ((mcp as any)?.contextManager) {
            return (mcp as any).contextManager.list();
        }
        return [];
    }),

    add: publicProcedure.input(z.object({
        filePath: z.string()
    })).mutation(({ input }) => {
        const mcp = getMcpServer();
        if ((mcp as any)?.contextManager) {
            return (mcp as any).contextManager.add(input.filePath);
        }
        return 'ContextManager not initialized';
    }),

    remove: publicProcedure.input(z.object({
        filePath: z.string()
    })).mutation(({ input }) => {
        const mcp = getMcpServer();
        if ((mcp as any)?.contextManager) {
            return (mcp as any).contextManager.remove(input.filePath);
        }
        return 'ContextManager not initialized';
    }),

    clear: publicProcedure.mutation(() => {
        const mcp = getMcpServer();
        if ((mcp as any)?.contextManager) {
            return (mcp as any).contextManager.clear();
        }
        return 'ContextManager not initialized';
    }),

    getPrompt: publicProcedure.query(() => {
        const mcp = getMcpServer();
        if ((mcp as any)?.contextManager) {
            return (mcp as any).contextManager.getContextPrompt();
        }
        return '';
    }),
});


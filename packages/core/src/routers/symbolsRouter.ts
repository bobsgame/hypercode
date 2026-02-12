import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';
import { getMcpServer } from '../lib/mcpHelper.js';

export const symbolsRouter = t.router({
    list: publicProcedure.query(() => {
        const mcp = getMcpServer();
        if ((mcp as any)?.symbolPinService) {
            return (mcp as any).symbolPinService.list();
        }
        return [];
    }),

    find: publicProcedure.input(z.object({
        query: z.string(),
        limit: z.number().default(10)
    })).query(async ({ input }) => {
        const mcp = getMcpServer();
        if (mcp && (mcp as any).memoryManager) {
            return await (mcp as any).memoryManager.searchSymbols(input.query, input.limit);
        }
        return [];
    }),

    pin: publicProcedure.input(z.object({
        name: z.string(),
        file: z.string(),
        type: z.enum(['function', 'class', 'method', 'variable', 'interface']),
        lineStart: z.number().optional(),
        lineEnd: z.number().optional(),
        notes: z.string().optional()
    })).mutation(({ input }) => {
        const mcp = getMcpServer();
        if ((mcp as any)?.symbolPinService) {
            return (mcp as any).symbolPinService.pin(input);
        }
        throw new Error('SymbolPinService not initialized');
    }),

    unpin: publicProcedure.input(z.object({
        id: z.string()
    })).mutation(({ input }) => {
        const mcp = getMcpServer();
        if ((mcp as any)?.symbolPinService) {
            return (mcp as any).symbolPinService.unpin(input.id);
        }
        return false;
    }),

    updatePriority: publicProcedure.input(z.object({
        id: z.string(),
        priority: z.number()
    })).mutation(({ input }) => {
        const mcp = getMcpServer();
        if ((mcp as any)?.symbolPinService) {
            return (mcp as any).symbolPinService.updatePriority(input.id, input.priority);
        }
        return false;
    }),

    addNotes: publicProcedure.input(z.object({
        id: z.string(),
        notes: z.string()
    })).mutation(({ input }) => {
        const mcp = getMcpServer();
        if ((mcp as any)?.symbolPinService) {
            return (mcp as any).symbolPinService.addNotes(input.id, input.notes);
        }
        return false;
    }),

    clear: publicProcedure.mutation(() => {
        const mcp = getMcpServer();
        if ((mcp as any)?.symbolPinService) {
            return (mcp as any).symbolPinService.clear();
        }
        return 0;
    }),

    forFile: publicProcedure.input(z.object({
        filePath: z.string()
    })).query(({ input }) => {
        const mcp = getMcpServer();
        if ((mcp as any)?.symbolPinService) {
            return (mcp as any).symbolPinService.forFile(input.filePath);
        }
        return [];
    }),
});


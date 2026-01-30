import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';

export const contextRouter = t.router({
    list: publicProcedure.query(() => {
        // @ts-ignore
        if (global.mcpServerInstance?.contextManager) {
            // @ts-ignore
            return global.mcpServerInstance.contextManager.list();
        }
        return [];
    }),

    add: publicProcedure.input(z.object({
        filePath: z.string()
    })).mutation(({ input }) => {
        // @ts-ignore
        if (global.mcpServerInstance?.contextManager) {
            // @ts-ignore
            return global.mcpServerInstance.contextManager.add(input.filePath);
        }
        return 'ContextManager not initialized';
    }),

    remove: publicProcedure.input(z.object({
        filePath: z.string()
    })).mutation(({ input }) => {
        // @ts-ignore
        if (global.mcpServerInstance?.contextManager) {
            // @ts-ignore
            return global.mcpServerInstance.contextManager.remove(input.filePath);
        }
        return 'ContextManager not initialized';
    }),

    clear: publicProcedure.mutation(() => {
        // @ts-ignore
        if (global.mcpServerInstance?.contextManager) {
            // @ts-ignore
            return global.mcpServerInstance.contextManager.clear();
        }
        return 'ContextManager not initialized';
    }),

    getPrompt: publicProcedure.query(() => {
        // @ts-ignore
        if (global.mcpServerInstance?.contextManager) {
            // @ts-ignore
            return global.mcpServerInstance.contextManager.getContextPrompt();
        }
        return '';
    }),
});

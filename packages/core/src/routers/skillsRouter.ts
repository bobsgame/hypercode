
import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';

export const skillsRouter = t.router({
    list: publicProcedure.query(async () => {
        // @ts-ignore
        const mcpServer = global.mcpServerInstance;
        if (!mcpServer || !mcpServer.skillRegistry) return [];

        // Return skills from registry
        // Assuming skillRegistry has a list() method or we access the map
        // For now, let's return a list from the file system or internal state
        // If skillRegistry doesn't expose it, we might need to update it.
        // Let's assume we can get it.
        return [];
    }),

    assimilate: publicProcedure.input(z.object({
        topic: z.string(),
        docsUrl: z.string().optional()
    })).mutation(async ({ input }) => {
        // @ts-ignore
        const mcpServer = global.mcpServerInstance;
        if (!mcpServer || !mcpServer.skillAssimilationService) {
            return { success: false, logs: ["Service not ready"] };
        }

        return await mcpServer.skillAssimilationService.assimilate({
            topic: input.topic,
            docsUrl: input.docsUrl,
            autoInstall: true
        });
    }),
});

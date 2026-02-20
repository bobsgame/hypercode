import { z } from 'zod';
import { t, publicProcedure, getBrowserService } from '../lib/trpc-core.js';

export const browserRouter = t.router({
    status: publicProcedure.query(() => {
        const service = getBrowserService();
        if (!service) {
            return {
                available: false,
                active: false,
                pageCount: 0,
                pageIds: [] as string[],
            };
        }

        const status = service.getStatus();
        return {
            available: true,
            ...status,
        };
    }),

    closePage: publicProcedure
        .input(z.object({ pageId: z.string().min(1) }))
        .mutation(async ({ input }) => {
            const service = getBrowserService();
            if (!service) {
                return { success: false, error: 'Browser service unavailable' };
            }

            await service.close(input.pageId);
            return { success: true };
        }),

    closeAll: publicProcedure.mutation(async () => {
        const service = getBrowserService();
        if (!service) {
            return { success: false, error: 'Browser service unavailable' };
        }

        await service.closeAll();
        return { success: true };
    }),
});

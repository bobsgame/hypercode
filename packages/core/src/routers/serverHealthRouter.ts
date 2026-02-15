import { z } from 'zod';
import { t, publicProcedure, adminProcedure } from '../lib/trpc-core.js';
import { serverErrorTracker } from '../services/server-error-tracker.service.js';

export const serverHealthRouter = t.router({
    check: publicProcedure
        .input(z.object({ serverUuid: z.string() }))
        .query(async ({ input }) => {
            const hasError = await serverErrorTracker.isServerInErrorState(input.serverUuid);
            const crashCount = serverErrorTracker.getServerAttempts(input.serverUuid);
            const maxAttempts = await serverErrorTracker.getServerMaxAttempts(input.serverUuid);

            return {
                status: hasError ? "ERROR" : "HEALTHY",
                crashCount,
                maxAttempts,
            };
        }),

    reset: adminProcedure
        .input(z.object({ serverUuid: z.string() }))
        .mutation(async ({ input }) => {
            await serverErrorTracker.resetServerErrorState(input.serverUuid);
            return { success: true };
        }),
});

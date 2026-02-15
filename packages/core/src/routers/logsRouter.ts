import { z } from 'zod';
import { t, publicProcedure, adminProcedure } from '../lib/trpc-core.js';
import { logsRepository } from '../db/repositories/index.js';
import { GetLogsRequestSchema } from '../types/metamcp/logs.zod.js';

export const logsRouter = t.router({
    list: publicProcedure
        .input(GetLogsRequestSchema)
        .query(async ({ input }) => {
            return await logsRepository.findAll(input.limit);
        }),

    clear: adminProcedure.mutation(async () => {
        await logsRepository.clear();
        return { success: true, message: "Logs cleared" };
    }),
});

import { z } from 'zod';
import { t, publicProcedure, adminProcedure } from '../lib/trpc-core.js';
import { toolsRepository } from '../db/repositories/index.js';
import {
    ToolCreateInputSchema,
    ToolUpsertInputSchema
} from '../types/metamcp/tools.zod.js';

export const toolsRouter = t.router({
    list: publicProcedure.query(async () => {
        return await toolsRepository.findAll();
    }),

    listByServer: publicProcedure
        .input(z.object({ mcpServerUuid: z.string() }))
        .query(async ({ input }) => {
            return await toolsRepository.findByMcpServerUuid(input.mcpServerUuid);
        }),

    get: publicProcedure
        .input(z.object({ uuid: z.string() }))
        .query(async ({ input }) => {
            return await toolsRepository.findByUuid(input.uuid);
        }),

    create: adminProcedure
        .input(ToolCreateInputSchema)
        .mutation(async ({ input }) => {
            return await toolsRepository.create(input);
        }),

    upsertBatch: adminProcedure
        .input(ToolUpsertInputSchema)
        .mutation(async ({ input }) => {
            return await toolsRepository.bulkUpsert(input);
        }),

    delete: adminProcedure
        .input(z.object({ uuid: z.string() }))
        .mutation(async ({ input }) => {
            return await toolsRepository.deleteByUuid(input.uuid);
        }),
});

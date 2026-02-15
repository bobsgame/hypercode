import { z } from 'zod';
import { t, publicProcedure, adminProcedure } from '../lib/trpc-core.js';
import { mcpServersRepository } from '../db/repositories/index.js';
import {
    McpServerCreateInputSchema,
    McpServerUpdateInputSchema
} from '../types/metamcp/index.js';

export const mcpServersRouter = t.router({
    list: publicProcedure.query(async () => {
        // TODO: Pass userId if auth context available
        return await mcpServersRepository.findAll();
    }),

    get: publicProcedure
        .input(z.object({ uuid: z.string() }))
        .query(async ({ input }) => {
            return await mcpServersRepository.findByUuid(input.uuid);
        }),

    create: adminProcedure
        .input(McpServerCreateInputSchema)
        .mutation(async ({ input }) => {
            return await mcpServersRepository.create(input);
        }),

    update: adminProcedure
        .input(McpServerUpdateInputSchema)
        .mutation(async ({ input }) => {
            if (!input.uuid) throw new Error("UUID required for update");
            return await mcpServersRepository.update(input);
        }),

    delete: adminProcedure
        .input(z.object({ uuid: z.string() }))
        .mutation(async ({ input }) => {
            return await mcpServersRepository.deleteByUuid(input.uuid);
        }),

    bulkImport: adminProcedure
        .input(z.array(McpServerCreateInputSchema))
        .mutation(async ({ input }) => {
            return await mcpServersRepository.bulkCreate(input);
        }),
});

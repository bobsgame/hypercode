import { z } from 'zod';
import { t, publicProcedure, adminProcedure } from '../lib/trpc-core.js';
import { apiKeysRepository } from '../db/repositories/index.js';
import {
    ApiKeyCreateInputSchema,
    ApiKeyUpdateInputSchema
} from '../types/metamcp/api-keys.zod.js';

export const apiKeysRouter = t.router({
    list: publicProcedure.query(async () => {
        return await apiKeysRepository.findAll();
    }),

    get: publicProcedure
        .input(z.object({ uuid: z.string() }))
        .query(async ({ input }) => {
            // Allow public access or system access
            return await apiKeysRepository.findByUuidWithAccess(input.uuid, 'system');
        }),

    create: adminProcedure
        .input(ApiKeyCreateInputSchema)
        .mutation(async ({ input }) => {
            return await apiKeysRepository.create({ ...input, user_id: 'system' });
        }),

    update: adminProcedure
        .input(ApiKeyUpdateInputSchema.extend({ uuid: z.string() }))
        .mutation(async ({ input }) => {
            return await apiKeysRepository.update(input.uuid, 'system', input);
        }),

    delete: adminProcedure
        .input(z.object({ uuid: z.string() }))
        .mutation(async ({ input }) => {
            return await apiKeysRepository.delete(input.uuid, 'system');
        }),

    validate: publicProcedure
        .input(z.object({ key: z.string() }))
        .mutation(async ({ input }) => {
            return await apiKeysRepository.validateApiKey(input.key);
        }),
});

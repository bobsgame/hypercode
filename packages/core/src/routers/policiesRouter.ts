import { z } from 'zod';
import { t, publicProcedure, adminProcedure } from '../lib/trpc-core.js';
import { policiesRepository } from '../db/repositories/index.js';
import {
    CreatePolicySchema,
    UpdatePolicySchema,
    DeletePolicySchema
} from '../types/metamcp/policies.zod.js';

export const policiesRouter = t.router({
    list: publicProcedure.query(async () => {
        return await policiesRepository.findAll();
    }),

    get: publicProcedure
        .input(z.object({ uuid: z.string() }))
        .query(async ({ input }) => {
            return await policiesRepository.findByUuid(input.uuid);
        }),

    create: adminProcedure
        .input(CreatePolicySchema)
        .mutation(async ({ input }) => {
            return await policiesRepository.create(input);
        }),

    update: adminProcedure
        .input(UpdatePolicySchema)
        .mutation(async ({ input }) => {
            return await policiesRepository.update(input);
        }),

    delete: adminProcedure
        .input(DeletePolicySchema)
        .mutation(async ({ input }) => {
            await policiesRepository.delete(input.uuid);
            return { success: true };
        }),
});

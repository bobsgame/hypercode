import { z } from 'zod';
import { t, publicProcedure, adminProcedure } from '../lib/trpc-core.js';
import { namespacesRepository } from '../db/repositories/index.js';
import {
    NamespaceCreateInputSchema,
    NamespaceUpdateInputSchema
} from '../types/metamcp/index.js';

export const namespacesRouter = t.router({
    list: publicProcedure.query(async () => {
        return await namespacesRepository.findAll();
    }),

    get: publicProcedure
        .input(z.object({ uuid: z.string() }))
        .query(async ({ input }) => {
            return await namespacesRepository.findByUuid(input.uuid);
        }),

    create: adminProcedure
        .input(NamespaceCreateInputSchema)
        .mutation(async ({ input }) => {
            return await namespacesRepository.create(input);
        }),

    update: adminProcedure
        .input(NamespaceUpdateInputSchema)
        .mutation(async ({ input }) => {
            if (!input.uuid) throw new Error("UUID required for update");
            return await namespacesRepository.update(input);
        }),

    delete: adminProcedure
        .input(z.object({ uuid: z.string() }))
        .mutation(async ({ input }) => {
            return await namespacesRepository.deleteByUuid(input.uuid);
        }),

    // Additional methods based on implementation plan
    // updateServerStatus, updateToolStatus, updateToolOverrides
    // These likely require specific Repo methods.
    // For now, basic CRUD is a good start.
});

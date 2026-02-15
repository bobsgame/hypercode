import { z } from 'zod';
import { t, publicProcedure, adminProcedure } from '../lib/trpc-core.js';
import { endpointsRepository } from '../db/repositories/index.js';
import {
    EndpointCreateInputSchema,
    EndpointUpdateInputSchema
} from '../types/metamcp/index.js';

export const endpointsRouter = t.router({
    list: publicProcedure.query(async () => {
        return await endpointsRepository.findAll();
    }),

    get: publicProcedure
        .input(z.object({ uuid: z.string() }))
        .query(async ({ input }) => {
            return await endpointsRepository.findByUuid(input.uuid);
        }),

    create: adminProcedure
        .input(EndpointCreateInputSchema)
        .mutation(async ({ input }) => {
            return await endpointsRepository.create(input);
        }),

    update: adminProcedure
        .input(EndpointUpdateInputSchema)
        .mutation(async ({ input }) => {
            if (!input.uuid) throw new Error("UUID required for update");
            return await endpointsRepository.update(input);
        }),

    delete: adminProcedure
        .input(z.object({ uuid: z.string() }))
        .mutation(async ({ input }) => {
            return await endpointsRepository.deleteByUuid(input.uuid);
        }),
});

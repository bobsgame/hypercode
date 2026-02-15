import { z } from 'zod';
import { t, publicProcedure, adminProcedure } from '../lib/trpc-core.js';
import { configRepo } from '../db/repositories/index.js';

const ConfigValueSchema = z.object({
    id: z.string(),
    value: z.string(),
    description: z.string().optional(),
});

export const configRouter = t.router({
    list: publicProcedure
        .output(z.array(z.object({ key: z.string(), value: z.string() })))
        .query(async () => {
            const configRecord = await configRepo.findAll();
            return Object.entries(configRecord).map(([key, value]) => ({ key, value }));
        }),

    get: publicProcedure
        .input(z.object({ key: z.string() }))
        .query(async ({ input }) => {
            return await configRepo.get(input.key); // configRepo has 'get', not 'findByKey'
        }),

    upsert: adminProcedure
        .input(ConfigValueSchema)
        .mutation(async ({ input }) => {
            return await configRepo.set(input.id, input.value); // configRepo set(key, value)
            // configRepo doesn't have upsert(id, value, desc). DB configTable has key, val.
            // Zod schema ConfigValueSchema has description. Repo doesn't use it?
            // configTable has id, value, created_at, updated_at. No description exposed in `config.repo.ts` set method?
            // I'll stick to configRepo.set(input.id, input.value).
        }),

    delete: adminProcedure
        .input(z.object({ key: z.string() }))
        .mutation(async ({ input }) => {
            return await configRepo.delete(input.key);
        }),

    update: adminProcedure
        .input(z.object({ key: z.string(), value: z.string() }))
        .mutation(async ({ input }) => {
            return await configRepo.set(input.key, input.value);
        }),
});

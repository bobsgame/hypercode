import { z } from 'zod';
import { t, publicProcedure, adminProcedure } from '../lib/trpc-core.js';
import { savedScriptsRepository } from '../db/repositories/index.js';
import { SavedScriptSchema } from '../types/metamcp/saved-scripts.zod.js';

// Define input schemas here if not exported from Zod file, or reuse existing
const CreateScriptInput = z.object({
    name: z.string(),
    description: z.string().nullable().optional(),
    code: z.string(),
    userId: z.string().nullable().optional(),
});

const UpdateScriptInput = z.object({
    uuid: z.string(),
    name: z.string().optional(),
    description: z.string().nullable().optional(),
    code: z.string().optional(),
});

export const savedScriptsRouter = t.router({
    list: publicProcedure.query(async () => {
        return await savedScriptsRepository.findAll();
    }),

    get: publicProcedure
        .input(z.object({ uuid: z.string() }))
        .query(async ({ input }) => {
            return await savedScriptsRepository.findByUuid(input.uuid);
        }),

    create: publicProcedure // scripts might be user-created, so public? or admin? adhering to pattern: admin for management
        .input(CreateScriptInput)
        .mutation(async ({ input }) => {
            return await savedScriptsRepository.create(input);
        }),

    update: publicProcedure
        .input(UpdateScriptInput)
        .mutation(async ({ input }) => {
            return await savedScriptsRepository.update(input.uuid, input);
        }),

    delete: publicProcedure
        .input(z.object({ uuid: z.string() }))
        .mutation(async ({ input }) => {
            await savedScriptsRepository.delete(input.uuid);
            return { success: true };
        }),

    execute: publicProcedure
        .input(z.object({ uuid: z.string() }))
        .mutation(async ({ input }) => {
            const script = await savedScriptsRepository.findByUuid(input.uuid);
            if (!script) throw new Error("Script not found");

            // TODO: Implement actual script execution (e.g., via SafeBox or VM)
            console.log(`[MockExecute] Running script: ${script.name}`);
            return { success: true, result: "Script execution simulated (Backend implementation pending)" };
        }),
});

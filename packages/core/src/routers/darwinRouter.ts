import { z } from 'zod';
import { t } from '../lib/trpc-core.js';
import { getMcpServer } from '../lib/mcpHelper.js';

export const darwinRouter = t.router({
    evolve: t.procedure.input(z.object({ prompt: z.string(), goal: z.string() })).mutation(async ({ input }) => {
        return getMcpServer().darwinService.proposeMutation(input.prompt, input.goal);
    }),
    experiment: t.procedure.input(z.object({ mutationId: z.string(), task: z.string() })).mutation(async ({ input }) => {
        const exp = await getMcpServer().darwinService.startExperiment(input.mutationId, input.task);
        return { experimentId: exp.id };
    }),
    getStatus: t.procedure.query(async () => {
        return getMcpServer().darwinService.getStatus();
    })
});

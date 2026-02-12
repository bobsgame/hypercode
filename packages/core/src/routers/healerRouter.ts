
import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';
import { getMcpServer } from '../lib/mcpHelper.js';
import { observable } from '@trpc/server/observable';

export const healerRouter: any = t.router({
    diagnose: t.procedure.input(z.object({ error: z.string(), context: z.string().optional() })).mutation(async ({ input }) => {
        return getMcpServer().healerService.analyzeError(input.error, input.context || "");
    }),
    heal: t.procedure.input(z.object({ error: z.string(), context: z.string().optional() })).mutation(async ({ input }) => {
        const success = await getMcpServer().healerService.heal(input.error, input.context || "");
        return { success };
    }),
    getHistory: t.procedure.query(async () => {
        return getMcpServer().healerService.getHistory();
    }),
    subscribe: publicProcedure.subscription(() => {
        return observable<any>((emit) => {
            const onHeal = (data: any) => {
                emit.next(data);
            };
            const service = getMcpServer().healerService;
            service.on('heal', onHeal);
            return () => {
                service.off('heal', onHeal);
            };
        });
    })
});

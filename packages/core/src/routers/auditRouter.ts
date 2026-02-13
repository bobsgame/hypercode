import { z } from 'zod';
import { t } from '../lib/trpc-core.js';
import { getMcpServer } from '../lib/mcpHelper.js';

export const auditRouter = t.router({
    query: t.procedure.input(z.object({ limit: z.number().optional() })).query(async ({ input }) => {
        return getMcpServer().auditService.getLogs(input.limit || 50);
    }),
    log: t.procedure.input(z.object({
        level: z.string(), agentId: z.string().optional(), action: z.string(), limit: z.number().optional()
    })).query(async ({ input }) => {
        return getMcpServer().auditService.query(input);
    })
});

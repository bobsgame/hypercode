import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';
import { getCouncilOrchestrator, getCouncilService } from '../lib/trpc-core.js';

const opinionSchema = z.object({
    agentId: z.string(),
    content: z.string(),
    timestamp: z.number(),
    round: z.number(),
});

const voteSchema = z.object({
    agentId: z.string(),
    choice: z.string(),
    reason: z.string(),
    timestamp: z.number(),
});

const councilSessionSchema = z.object({
    id: z.string(),
    topic: z.string(),
    status: z.enum(['active', 'concluded']),
    round: z.number(),
    opinions: z.array(opinionSchema),
    votes: z.array(voteSchema),
    createdAt: z.number(),
});

export const councilRouter = t.router({
    runSession: publicProcedure.input(z.object({ proposal: z.string() })).mutation(async ({ input }) => {
        return getCouncilOrchestrator().runConsensusSession(input.proposal);
    }),
    getLatestSession: publicProcedure.query(async () => {
        return getCouncilOrchestrator().lastResult || null;
    }),
    listSessions: publicProcedure.output(z.array(councilSessionSchema)).query(async () => {
        return getCouncilService().listSessions();
    }),
    getSession: publicProcedure.input(z.object({ id: z.string() })).output(councilSessionSchema.nullable()).query(async ({ input }) => {
        return getCouncilService().getSession(input.id) ?? null;
    })
});

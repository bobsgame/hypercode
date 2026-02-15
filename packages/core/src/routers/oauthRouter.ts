import { z } from 'zod';
import { t, publicProcedure, adminProcedure } from '../lib/trpc-core.js';
import { oauthRepository, oauthSessionsRepository } from '../db/repositories/index.js';
import {
    OAuthClientCreateInputSchema,
    OAuthSessionCreateInputSchema
} from '../types/metamcp/oauth.zod.js';

const clientsRouter = t.router({
    create: adminProcedure
        .input(OAuthClientCreateInputSchema)
        .mutation(async ({ input }) => {
            return await oauthRepository.createClient(input);
        }),

    get: adminProcedure
        .input(z.object({ clientId: z.string() }))
        .query(async ({ input }) => {
            return await oauthRepository.findClientById(input.clientId);
        }),
});

const sessionsRouter = t.router({
    upsert: adminProcedure
        .input(OAuthSessionCreateInputSchema)
        .mutation(async ({ input }) => {
            return await oauthSessionsRepository.upsert(input);
        }),

    getByServer: adminProcedure
        .input(z.object({ mcpServerUuid: z.string() }))
        .query(async ({ input }) => {
            return await oauthSessionsRepository.findByMcpServerUuid(input.mcpServerUuid);
        }),
});

export const oauthRouter = t.router({
    clients: clientsRouter,
    sessions: sessionsRouter,
    exchange: publicProcedure
        .input(z.object({ code: z.string(), state: z.string() }))
        .mutation(async ({ input }) => {
            // TODO: Implement actual OAuth exchange logic
            // This needs to:
            // 1. Verify state matches a pending session
            // 2. Call provider token endpoint
            // 3. Update session with tokens
            console.log("OAuth Exchange Stub:", input);
            return { success: true, tokens: { access_token: "mock_token" } };
        }),
});

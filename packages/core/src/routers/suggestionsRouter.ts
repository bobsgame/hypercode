import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';
import { getMcpServer } from '../lib/mcpHelper.js';

export const suggestionsRouter = t.router({
    list: publicProcedure.query(() => {
        const mcp = getMcpServer();
        if (mcp?.suggestionService) {
            return mcp.suggestionService.getPendingSuggestions();
        }
        return [];
    }),
    resolve: publicProcedure.input(z.object({
        id: z.string(),
        status: z.enum(['APPROVED', 'REJECTED'])
    })).mutation(async ({ input }) => {
        const mcp = getMcpServer();
        if (mcp?.suggestionService) {
            const suggestion = mcp.suggestionService.resolveSuggestion(input.id, input.status);

            // EXECUTION LOGIC FOR APPROVED ACTIONS
            if (suggestion && input.status === 'APPROVED' && suggestion.payload && suggestion.payload.tool) {
                console.log(`[Borg Core] Auto-Executing Approved Suggestion: ${suggestion.title}`);
                await mcp.executeTool(suggestion.payload.tool, suggestion.payload.args || {});
            }
            return suggestion;
        }
        return null;
    }),
    clearAll: publicProcedure.mutation(() => {
        const mcp = getMcpServer();
        if (mcp?.suggestionService) {
            mcp.suggestionService.clearAll();
        }
        return true;
    })
});


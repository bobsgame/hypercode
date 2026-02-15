import { z } from 'zod';
import { t, publicProcedure, getMcpServer } from '../lib/trpc-core.js';
import { TRPCError } from '@trpc/server';

export const agentRouter = t.router({
    /**
     * Run a specific tool by name with arguments.
     * Used by Inspector and Agents.
     */
    runTool: publicProcedure
        .input(z.object({
            serverName: z.string().optional(), // Optional if name is unique or namespaced
            toolName: z.string(),
            arguments: z.record(z.any()).optional().default({}),
        }))
        .mutation(async ({ input }) => {
            const server = getMcpServer();
            if (!server) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'MCP Server not initialized' });
            }

            // In MetaMCP/Borg, tools are often namespaced: "server__tool" or just "tool" if unique.
            // If serverName is provided, we might need to look it up specifically, 
            // but the aggregator usually acts as a unified client.
            // We'll call the server's executeTool method which handles policies and permissions.

            try {
                // If the aggregator exposes a direct client-like interface:
                const result = await server.executeTool(input.toolName, input.arguments);

                return result;
            } catch (error: any) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error.message || 'Tool execution failed',
                    cause: error
                });
            }
        }),

    /**
     * Simple chat interface for the Agent Playground.
     * Uses the "expert" or default LLM to reason about tools.
     */
    chat: publicProcedure
        .input(z.object({
            message: z.string(),
            context: z.any().optional(),
        }))
        .mutation(async ({ input }) => {
            // This would ideally connect to an LLM service that has access to the MCP tools.
            // For now, we can stub it or link to the 'expert' system.
            // Let's reuse the 'expertRouter' logic conceptually or call a service.

            // Placeholder: Echo back with tool suggestion if we can't call LLM directly here yet.
            // In a real implementation this calls `mcp.agent.chat(...)`

            return {
                response: `[Agent] I received: "${input.message}". (LLM integration pending full wiring)`,
                tool_calls: []
            };
        }),
});

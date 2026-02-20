import { z } from 'zod';
import { t, publicProcedure, adminProcedure } from '../lib/trpc-core.js';
import { toolRegistry, RegisteredTool } from '../services/ToolRegistry.js';
import {
    ToolCreateInputSchema,
    ToolUpsertInputSchema
} from '../types/metamcp/tools.zod.js';

export const toolsRouter = t.router({
    list: publicProcedure.query(async () => {
        return toolRegistry.getAllTools().map(rt => ({
            ...rt,
            uuid: rt.tool.name, // Name is now already namespaced
            server: rt.serverName,
            description: rt.tool.description,
            inputSchema: rt.tool.inputSchema
        }));
    }),

    listByServer: publicProcedure
        .input(z.object({ mcpServerUuid: z.string() }))
        .query(async ({ input }) => {
            const tools = toolRegistry.getAllTools().filter(t => t.mcpServerUuid === input.mcpServerUuid || t.serverName === input.mcpServerUuid);
            return tools.map(rt => ({
                ...rt,
                uuid: rt.tool.name,
                server: rt.serverName,
                description: rt.tool.description,
                inputSchema: rt.tool.inputSchema
            }));
        }),

    search: publicProcedure
        .input(z.object({
            query: z.string().min(1),
            limit: z.number().min(1).max(100).default(30),
        }))
        .query(async ({ input }) => {
            const all = toolRegistry.getAllTools();
            const q = input.query.toLowerCase();

            const filtered = all.filter((rt: RegisteredTool) => {
                const name = String(rt.tool.name ?? '').toLowerCase();
                const description = String(rt.tool.description ?? '').toLowerCase();
                const server = String(rt.serverName ?? '').toLowerCase();
                return name.includes(q) || description.includes(q) || server.includes(q);
            });

            return filtered.slice(0, input.limit).map(rt => ({
                ...rt,
                uuid: rt.tool.name,
                server: rt.serverName,
                description: rt.tool.description,
                inputSchema: rt.tool.inputSchema
            }));
        }),

    get: publicProcedure
        .input(z.object({ uuid: z.string() }))
        .query(async ({ input }) => {
            // Treat input.uuid as tool name
            const rt = toolRegistry.getTool(input.uuid);
            if (!rt) return null;
            return {
                ...rt,
                uuid: rt.tool.name,
                description: rt.tool.description,
                inputSchema: rt.tool.inputSchema,
                server: rt.serverName
            };
        }),

    create: adminProcedure
        .input(ToolCreateInputSchema)
        .mutation(async ({ input }) => {
            // Map DB-style validation schema to ToolRegistry expectations
            toolRegistry.registerTool({
                name: input.name,
                description: input.description ?? undefined, // Handle null -> undefined
                inputSchema: input.toolSchema as any // Map toolSchema -> inputSchema
            }, input.mcp_server_uuid, "manual");
            return { success: true };
        }),

    upsertBatch: adminProcedure
        .input(ToolUpsertInputSchema)
        .mutation(async ({ input }) => {
            // Schema is { tools: [...], mcpServerUuid: ... }
            const { tools, mcpServerUuid } = input;

            tools.forEach(t => {
                if (!t.inputSchema) return; // Skip if no schema?
                toolRegistry.registerTool({
                    name: t.name,
                    description: t.description ?? undefined,
                    inputSchema: t.inputSchema as any
                }, mcpServerUuid, "batch");
            });
            return { success: true };
        }),

    delete: adminProcedure
        .input(z.object({ uuid: z.string() }))
        .mutation(async ({ input }) => {
            toolRegistry.deleteTool(input.uuid);
            return { success: true };
        }),
});

import { z } from 'zod';
import { t, publicProcedure, adminProcedure } from '../lib/trpc-core.js';
import { getMcpServer } from '../lib/mcpHelper.js';

export const mcpRouter = t.router({
    /** List all registered downstream MCP servers */
    listServers: publicProcedure.query(async () => {
        const mcp = getMcpServer();
        try {
            const servers = await (mcp as any).mcpAggregator?.listServers?.() ?? [];
            return servers.map((s: any) => ({
                name: s.name ?? 'unknown',
                status: s.status ?? 'unknown',
                toolCount: s.toolCount ?? s.tools?.length ?? 0,
                config: {
                    command: s.config?.command ?? s.command ?? '',
                    args: s.config?.args ?? s.args ?? [],
                    env: s.config?.env ? Object.keys(s.config.env) : [],
                },
            }));
        } catch {
            return [];
        }
    }),

    /** List all aggregated tools across servers */
    listTools: publicProcedure.query(async () => {
        const mcp = getMcpServer();
        try {
            const tools = await (mcp as any).mcpAggregator?.listAggregatedTools?.() ?? [];
            return tools.map((tool: any) => ({
                name: tool.name,
                description: tool.description ?? '',
                server: tool.server ?? 'unknown',
                inputSchema: tool.inputSchema ?? null,
            }));
        } catch {
            return [];
        }
    }),

    /** Get aggregator status and stats */
    getStatus: publicProcedure.query(async () => {
        const mcp = getMcpServer();
        const aggregator = (mcp as any).mcpAggregator;
        if (!aggregator) return { initialized: false, serverCount: 0, toolCount: 0, connectedCount: 0 };

        try {
            const servers = await aggregator.listServers?.() ?? [];
            const tools = await aggregator.listAggregatedTools?.() ?? [];
            return {
                initialized: true,
                serverCount: servers.length,
                toolCount: tools.length,
                connectedCount: servers.filter((s: any) => s.status === 'connected').length,
            };
        } catch {
            return { initialized: false, serverCount: 0, toolCount: 0, connectedCount: 0 };
        }
    }),

    /** Add a new downstream MCP server */
    addServer: adminProcedure.input(z.object({
        name: z.string().min(1),
        command: z.string().min(1),
        args: z.array(z.string()).optional().default([]),
        env: z.record(z.string()).optional().default({}),
    })).mutation(async ({ input }) => {
        const mcp = getMcpServer();
        const aggregator = (mcp as any).mcpAggregator;
        if (!aggregator) throw new Error('MCP Aggregator not initialized');

        await aggregator.addServerConfig(input.name, {
            command: input.command,
            args: input.args,
            env: input.env,
            enabled: true,
        });
        return { success: true, name: input.name };
    }),

    /** Remove a downstream MCP server */
    removeServer: adminProcedure.input(z.object({
        name: z.string(),
    })).mutation(async ({ input }) => {
        const mcp = getMcpServer();
        const aggregator = (mcp as any).mcpAggregator;
        if (!aggregator) throw new Error('MCP Aggregator not initialized');

        // Disconnect client if connected
        const clients = (aggregator as any).clients as Map<string, any>;
        const client = clients.get(input.name);
        if (client) {
            try { await client.close(); } catch { /* ignore */ }
            clients.delete(input.name);
        }

        // Remove from config file
        const fs = await import('fs');
        const configPath = (aggregator as any).configPath;
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            delete config[input.name];
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        }

        return { success: true };
    }),
});

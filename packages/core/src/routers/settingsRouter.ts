import { z } from 'zod';
import { t, publicProcedure, getMcpServer } from '../lib/trpc-core.js';

export const settingsRouter = t.router({
    get: publicProcedure.query(() => {
        const mcp = getMcpServer();
        if (mcp && (mcp as any).configManager) {
            return (mcp as any).configManager.loadConfig() || {};
        }
        return {};
    }),
    update: publicProcedure.input(z.object({
        config: z.any()
    })).mutation(({ input }) => {
        const mcp = getMcpServer();
        if (mcp && mcp.configManager) {
            mcp.configManager.saveConfig(input.config);
            return { success: true };
        }
        throw new Error("ConfigManager not ready");
    })
});

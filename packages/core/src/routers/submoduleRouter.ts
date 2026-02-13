import { z } from 'zod';
import { t, publicProcedure, adminProcedure } from '../lib/trpc-core.js';
import { getMcpServer } from '../lib/mcpHelper.js';

export const submoduleRouter = t.router({
    list: publicProcedure.query(async () => {
        const mcp = getMcpServer();
        if ((mcp as any).submoduleService) {
            return await (mcp as any).submoduleService.listSubmodules();
        }
        return [];
    }),
    updateAll: adminProcedure.mutation(async () => {
        const mcp = getMcpServer();
        if ((mcp as any).submoduleService) {
            return await (mcp as any).submoduleService.updateAll();
        }
        return { success: false, output: "SubmoduleService not available" };
    }),
    installDependencies: adminProcedure.input(z.object({
        path: z.string()
    })).mutation(async ({ input }) => {
        const mcp = getMcpServer();
        if ((mcp as any).submoduleService) {
            return await (mcp as any).submoduleService.installDependencies(input.path);
        }
        return { success: false, output: "SubmoduleService not available" };
    }),
    build: adminProcedure.input(z.object({
        path: z.string()
    })).mutation(async ({ input }) => {
        const mcp = getMcpServer();
        if ((mcp as any).submoduleService) {
            // Check if build is supported first? Service handles it.
            return await (mcp as any).submoduleService.buildSubmodule(input.path);
        }
        return { success: false, output: "SubmoduleService not available" };
    }),
    enable: adminProcedure.input(z.object({
        path: z.string()
    })).mutation(async ({ input }) => {
        const mcp = getMcpServer();
        if ((mcp as any).submoduleService) {
            return await (mcp as any).submoduleService.enableSubmodule(input.path);
        }
        return { success: false, output: "SubmoduleService not available" };
    }),
    detectCapabilities: publicProcedure.input(z.object({
        path: z.string()
    })).query(({ input }) => {
        const mcp = getMcpServer();
        if ((mcp as any).submoduleService) {
            return (mcp as any).submoduleService.detectCapabilities(input.path);
        }
        return { caps: [], startCommand: undefined };
    })
});

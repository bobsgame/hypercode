
import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';
import { getMcpServer } from '../lib/mcpHelper.js';

export const skillsRouter = t.router({
    list: publicProcedure.query(async () => {
        const mcp = getMcpServer();
        if (!mcp || !mcp.skillRegistry) return [];
        return mcp.skillRegistry.getSkills();
    }),

    read: publicProcedure.input(z.object({
        name: z.string()
    })).query(async ({ input }) => {
        const mcp = getMcpServer();
        if (!mcp || !mcp.skillRegistry) {
            return { content: [{ type: "text", text: "Skill registry not available" }] };
        }
        return mcp.skillRegistry.readSkill(input.name);
    }),

    create: publicProcedure.input(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string()
    })).mutation(async ({ input }) => {
        const mcp = getMcpServer();
        if (!mcp || !mcp.skillRegistry) {
            return { content: [{ type: "text", text: "Skill registry not available" }] };
        }
        return mcp.skillRegistry.createSkill(input.id, input.name, input.description);
    }),

    save: publicProcedure.input(z.object({
        id: z.string(),
        content: z.string()
    })).mutation(async ({ input }) => {
        const mcp = getMcpServer();
        if (!mcp || !mcp.skillRegistry) {
            return { content: [{ type: "text", text: "Skill registry not available" }] };
        }
        return mcp.skillRegistry.saveSkill(input.id, input.content);
    }),

    assimilate: publicProcedure.input(z.object({
        topic: z.string(),
        docsUrl: z.string().optional()
    })).mutation(async ({ input }) => {
        const mcp = getMcpServer();
        if (!mcp || !mcp.skillAssimilationService) {
            return { success: false, logs: ["Service not ready"] };
        }

        return await mcp.skillAssimilationService.assimilate({
            topic: input.topic,
            docsUrl: input.docsUrl,
            autoInstall: true
        });
    }),
});


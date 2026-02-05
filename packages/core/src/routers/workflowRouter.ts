import { z } from 'zod';
import { t, publicProcedure, adminProcedure } from '../lib/trpc-core.js';

export const workflowRouter = t.router({
    // --- Workflow Definitions ---

    list: publicProcedure.query(() => {
        // We need a way to list registered workflows from the engine
        // Currently WorkflowEngine doesn't expose a listWorkflows method publicly on the class instance in a simple way 
        // effectively, but we can add one or accessing internal map if we cast.
        // Let's assume we update WorkflowEngine to have listWorkflows() or we add it now.
        // Looking at previous code, I didn't add listWorkflows() to WorkflowEngine, only listExecutions().
        // I should probably add listWorkflows to WorkflowEngine first or just rely on what we have.
        // For now, let's just cast or access if possible, or better: Update WorkflowEngine in next step if needed.
        // Actually, let's assume we will add it.

        // @ts-ignore
        const engine = global.mcpServerInstance?.workflowEngine;
        if (!engine) return [];

        // Retrieve private map via reflection or add public accessor
        // For safe implementation without re-editing Engine immediately, let's try to access if it was public
        // or just return empty if not available yet. 
        // Ideally we should add `getWorkflows()` to engine. note: we added getGraph(id).

        // Let's implement what simple methods we can.
        return [];
    }),

    getGraph: publicProcedure
        .input(z.object({ workflowId: z.string() }))
        .query(({ input }) => {
            // @ts-ignore
            const engine = global.mcpServerInstance?.workflowEngine;
            if (!engine) throw new Error("Workflow Engine not initialized");

            return engine.getGraph(input.workflowId) || { nodes: [], edges: [] };
        }),

    // --- Executions ---

    start: adminProcedure
        .input(z.object({
            workflowId: z.string(),
            initialState: z.record(z.any()).optional()
        }))
        .mutation(async ({ input }) => {
            // @ts-ignore
            const engine = global.mcpServerInstance?.workflowEngine;
            if (!engine) throw new Error("Workflow Engine not initialized");

            const execution = await engine.start(input.workflowId, input.initialState || {});
            return execution;
        }),

    listExecutions: publicProcedure.query(() => {
        // @ts-ignore
        const engine = global.mcpServerInstance?.workflowEngine;
        if (!engine) return [];
        return engine.listExecutions();
    }),

    getExecution: publicProcedure
        .input(z.object({ executionId: z.string() }))
        .query(({ input }) => {
            // @ts-ignore
            const engine = global.mcpServerInstance?.workflowEngine;
            if (!engine) return null;
            return engine.getExecution(input.executionId);
        }),

    getHistory: publicProcedure
        .input(z.object({ executionId: z.string() }))
        .query(({ input }) => {
            // @ts-ignore
            const engine = global.mcpServerInstance?.workflowEngine;
            if (!engine) return [];
            return engine.getHistory(input.executionId);
        }),

    // --- Control Flow ---

    resume: adminProcedure
        .input(z.object({ executionId: z.string() }))
        .mutation(async ({ input }) => {
            // @ts-ignore
            const engine = global.mcpServerInstance?.workflowEngine;
            if (!engine) throw new Error("Workflow Engine not initialized");
            await engine.resume(input.executionId);
            return { success: true };
        }),

    pause: adminProcedure
        .input(z.object({ executionId: z.string() }))
        .mutation(({ input }) => {
            // @ts-ignore
            const engine = global.mcpServerInstance?.workflowEngine;
            if (!engine) throw new Error("Workflow Engine not initialized");
            engine.pause(input.executionId);
            return { success: true };
        }),

    approve: adminProcedure
        .input(z.object({ executionId: z.string() }))
        .mutation(async ({ input }) => {
            // @ts-ignore
            const engine = global.mcpServerInstance?.workflowEngine;
            if (!engine) throw new Error("Workflow Engine not initialized");
            await engine.approve(input.executionId);
            return { success: true };
        }),

    reject: adminProcedure
        .input(z.object({
            executionId: z.string(),
            reason: z.string().optional()
        }))
        .mutation(({ input }) => {
            // @ts-ignore
            const engine = global.mcpServerInstance?.workflowEngine;
            if (!engine) throw new Error("Workflow Engine not initialized");
            engine.reject(input.executionId, input.reason);
            return { success: true };
        })
});

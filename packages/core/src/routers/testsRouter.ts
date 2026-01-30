import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';

export const testsRouter = t.router({
    status: publicProcedure.query(() => {
        // @ts-ignore
        if (global.mcpServerInstance?.autoTestService) {
            // @ts-ignore
            const service = global.mcpServerInstance.autoTestService;
            const results: Record<string, { status: string; timestamp: number; output?: string }> = {};
            for (const [file, result] of service.testResults.entries()) {
                results[file] = result;
            }
            return {
                isRunning: service.isRunning,
                results
            };
        }
        return { isRunning: false, results: {} };
    }),

    start: publicProcedure.mutation(async () => {
        // @ts-ignore
        if (global.mcpServerInstance?.autoTestService) {
            // @ts-ignore
            await global.mcpServerInstance.autoTestService.start();
            return { success: true };
        }
        return { success: false, error: 'AutoTestService not initialized' };
    }),

    stop: publicProcedure.mutation(() => {
        // @ts-ignore
        if (global.mcpServerInstance?.autoTestService) {
            // @ts-ignore
            global.mcpServerInstance.autoTestService.stop();
            return { success: true };
        }
        return { success: false, error: 'AutoTestService not initialized' };
    }),

    run: publicProcedure.input(z.object({
        filePath: z.string()
    })).mutation(async ({ input }) => {
        // @ts-ignore
        if (global.mcpServerInstance?.autoTestService) {
            // @ts-ignore
            const service = global.mcpServerInstance.autoTestService;
            // Manually trigger test runner
            const testFile = service.findTestFile?.(input.filePath);
            if (testFile) {
                service.runTest?.(testFile);
                return { success: true, testFile };
            }
            return { success: false, error: 'No test file found' };
        }
        return { success: false, error: 'AutoTestService not initialized' };
    }),

    results: publicProcedure.query(() => {
        // @ts-ignore
        if (global.mcpServerInstance?.autoTestService) {
            // @ts-ignore
            const service = global.mcpServerInstance.autoTestService;
            const results: Array<{ file: string; status: string; timestamp: number; output?: string }> = [];
            for (const [file, result] of service.testResults.entries()) {
                results.push({ file, ...result });
            }
            return results.sort((a, b) => b.timestamp - a.timestamp);
        }
        return [];
    }),
});

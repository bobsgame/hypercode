import { z } from 'zod';
import { t } from '../lib/trpc-core.js';
import { getMcpServer } from '../lib/mcpHelper.js';

export const directorConfigRouter = t.router({
    get: t.procedure.query(async () => {
        return getMcpServer().director.getConfig();
    }),
    update: t.procedure.input(z.object({
        defaultTopic: z.string().optional(),
        taskCooldownMs: z.number().optional(),
        heartbeatIntervalMs: z.number().optional(),
        periodicSummaryMs: z.number().optional(),
        pasteToSubmitDelayMs: z.number().optional(),
        acceptDetectionMode: z.enum(['state', 'polling']).optional(),
        pollingIntervalMs: z.number().optional(),
        persona: z.enum(['default', 'homie', 'professional', 'chaos']).optional(),
        customInstructions: z.string().optional(),
        council: z.any().optional(),
        autoSubmitChat: z.boolean().optional(),
        enableChatPaste: z.boolean().optional(),
        enableCouncil: z.boolean().optional(),
        stopDirector: z.boolean().optional(),
        chatPrefix: z.string().optional(),
        directorActionPrefix: z.string().optional(),
        councilPrefix: z.string().optional(),
        statusPrefix: z.string().optional(),
        lmStudioTimeoutMs: z.number().optional(),
        nudgeThresholdMs: z.number().optional(),
        verboseLogging: z.boolean().optional()
    })).mutation(({ input }) => {
        getMcpServer().director.updateConfig(input);
        return { success: true };
    })
});

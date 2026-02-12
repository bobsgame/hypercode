
import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';
import { getMcpServer } from '../lib/mcpHelper.js';

export const billingRouter = t.router({
    getStatus: publicProcedure.query(async () => {
        // Check Env Keys (MASKED)
        const keys = {
            openai: !!process.env.OPENAI_API_KEY,
            anthropic: !!process.env.ANTHROPIC_API_KEY,
            gemini: !!process.env.GEMINI_API_KEY,
            mistral: !!process.env.MISTRAL_API_KEY
        };

        const mcp = getMcpServer();
        const stats = mcp.llmService.getCostStats();
        const quota = mcp.llmService.modelSelector.getQuotaService();

        // Get detailed breakdown
        let breakdown = quota.getUsageByModel();

        // Fallback if empty (initial state)
        if (breakdown.length === 0) {
            breakdown = [
                { provider: 'No Usage Yet', cost: 0, requests: 0 }
            ];
        }

        const usage = {
            currentMonth: stats.estimatedCostUSD,
            limit: 100.00,
            breakdown: breakdown
        };

        return { keys, usage };
    })
});

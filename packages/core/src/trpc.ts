import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { t, publicProcedure, adminProcedure } from './lib/trpc-core.js';
import { type Diagnosis, type HealRecord } from './services/HealerService.js';
import { observable } from '@trpc/server/observable';
import { getMcpServer } from './lib/mcpHelper.js';
import { suggestionsRouter } from './routers/suggestionsRouter.js';
import { squadRouter } from './routers/squadRouter.js';
import { councilRouter } from './routers/councilRouter.js';
import { graphRouter } from './routers/graphRouter.js';
import { workflowRouter } from './routers/workflowRouter.js';
import { testsRouter } from './routers/testsRouter.js';
import { contextRouter } from './routers/contextRouter.js';
import { commandsRouter } from './routers/commandsRouter.js';
import { symbolsRouter } from './routers/symbolsRouter.js';
import { autoDevRouter } from './routers/autoDevRouter.js';
import { shellRouter } from './routers/shellRouter.js';
import { memoryRouter } from './routers/memoryRouter.js';
import { skillsRouter } from './routers/skillsRouter.js';
import { researchRouter } from './routers/researchRouter.js';
import { pulseRouter } from './routers/pulseRouter.js';

// Re-export core definitions for other files that might rely on them
export { t, publicProcedure, adminProcedure };

import { knowledgeRouter } from './routers/knowledgeRouter.js';
import { agentMemoryRouter } from './routers/agentMemoryRouter.js';
import { planRouter as planServiceRouter } from './routers/planRouter.js';
import { metricsRouter as metricsServiceRouter } from './routers/metricsRouter.js';
import { supervisorRouter } from './routers/supervisorRouter.js';
import { lspRouter } from './routers/lspRouter.js';
import { settingsRouter } from './routers/settingsRouter.js';

import { sessionRouter } from './routers/sessionRouter.js';
import { billingRouter } from './routers/billingRouter.js';
import { mcpRouter } from './routers/mcpRouter.js';


// import { type AnyTRPCRouter } from '@trpc/server';

export const appRouter = t.router({
    graph: graphRouter,
    workflow: workflowRouter,
    tests: testsRouter,
    borgContext: contextRouter,
    commands: commandsRouter,
    symbols: symbolsRouter,
    autoDev: autoDevRouter,
    shell: shellRouter,
    memory: memoryRouter,
    knowledge: knowledgeRouter,
    research: researchRouter,
    pulse: pulseRouter,
    skills: skillsRouter,
    squad: squadRouter,
    suggestions: suggestionsRouter,
    council: councilRouter,
    supervisor: supervisorRouter,
    metrics: metricsServiceRouter,
    lsp: lspRouter,
    agentMemory: agentMemoryRouter,
    planService: planServiceRouter,
    settings: settingsRouter,
    session: sessionRouter,
    billing: billingRouter,
    mcp: mcpRouter,
    healer: t.router({
        diagnose: t.procedure.input(z.object({ error: z.string(), context: z.string().optional() })).mutation(async ({ input }) => {
            return getMcpServer().healerService.analyzeError(input.error, input.context || "");
        }),
        heal: t.procedure.input(z.object({ error: z.string(), context: z.string().optional() })).mutation(async ({ input }) => {
            const success = await getMcpServer().healerService.heal(input.error, input.context || "");
            return { success };
        }),
        getHistory: t.procedure.query(async (): Promise<HealRecord[]> => {
            return getMcpServer().healerService.getHistory();
        }),
        // subscribe: publicProcedure.subscription(() => {
        //     return observable<any>((emit) => {
        //         const onHeal = (data: any) => {
        //             emit.next(data);
        //         };
        //         const service = getMcpServer().healerService;
        //         service.on('heal', onHeal);
        //         return () => {
        //             service.off('heal', onHeal);
        //         };
        //     });
        // })
    }),
    darwin: t.router({
        evolve: t.procedure.input(z.object({ prompt: z.string(), goal: z.string() })).mutation(async ({ input }) => {
            return getMcpServer().darwinService.proposeMutation(input.prompt, input.goal);
        }),
        experiment: t.procedure.input(z.object({ mutationId: z.string(), task: z.string() })).mutation(async ({ input }) => {
            const exp = await getMcpServer().darwinService.startExperiment(input.mutationId, input.task);
            return { experimentId: exp.id };
        }),
        getStatus: t.procedure.query(async () => {
            return getMcpServer().darwinService.getStatus();
        })
    }),
    health: publicProcedure.query(() => {
        return { status: 'running', service: '@borg/core' };
    }),
    getTaskStatus: publicProcedure
        .input(z.object({ taskId: z.string().optional() }))
        .query(({ input }) => {
            const mcp = getMcpServer();
            if (!mcp || !mcp.projectTracker) return { taskId: 'offline', status: 'offline', progress: 0, currentTask: 'Offline' };

            const status = mcp.projectTracker.getStatus();
            return {
                taskId: status.currentTask,
                currentTask: status.currentTask,
                status: status.status,
                progress: status.progress
            };
        }),
    indexingStatus: t.procedure.query(() => {
        const mcp = getMcpServer();
        if (!mcp || !mcp.lspService) return { status: 'offline', filesIndexed: 0, totalFiles: 0 };
        return mcp.lspService.getStatus();
    }),
    // remoteAccess, config, logs routers — removed (not wired)
    autonomy: t.router({
        setLevel: t.procedure.input(z.object({ level: z.enum(['low', 'medium', 'high']) })).mutation(async ({ input }) => {
            getMcpServer().permissionManager.setAutonomyLevel(input.level);
            return input.level;
        }),
        getLevel: t.procedure.query(() => {
            return getMcpServer().permissionManager.autonomyLevel;
        }),
        activateFullAutonomy: t.procedure.mutation(async () => {
            const mcp = getMcpServer();
            mcp.permissionManager.setAutonomyLevel('high');
            // @ts-ignore - Private/Missing method usage preserved from original
            mcp.director.startChatDaemon();
            // @ts-ignore - Private/Missing method usage preserved from original
            mcp.director.startWatchdog(100);
            return "Autonomous Supervisor Activated (High Level + Chat Daemon + Watchdog)";
        })
    }),
    director: t.router({
        memorize: t.procedure.input(z.object({ content: z.string(), source: z.string(), title: z.string().optional() })).mutation(async ({ input }) => {
            await getMcpServer().memoryManager.saveContext(input.content, {
                source: input.source,
                title: input.title || 'Untitled Web Page',
                type: 'web_page'
            });
            return "Memorized.";
        }),
        chat: t.procedure.input(z.object({ message: z.string() })).mutation(async ({ input }) => {
            const server = getMcpServer();

            // 1. Intercept Slash Commands
            if (input.message.trim().startsWith('/')) {
                const commandResult = await server.commandRegistry.execute(input.message);
                if (commandResult && commandResult.handled) {
                    return commandResult.output;
                }
            }

            // 2. Intercept "Yes" / "Approve" for Suggestions
            const pending = server.suggestionService.getPendingSuggestions();
            if (pending.length > 0 && /^(yes|approve|do it|confirm|ok)$/i.test(input.message.trim())) {
                const latest = pending[0];
                const suggestion = server.suggestionService.resolveSuggestion(latest.id, 'APPROVED');

                if (suggestion && suggestion.payload?.tool) {
                    // @ts-ignore - Private/Missing method
                    server.director.broadcast(`✅ Approved: **${latest.title}**. Executing ${suggestion.payload.tool}...`);
                    const result = await server.executeTool(suggestion.payload.tool, suggestion.payload.args);
                    return `✅ Execution Complete.\n\nResult:\n${JSON.stringify(result)?.substring(0, 200)}...`;
                }

                return `✅ Approved suggestion: **${latest.title}**. (No tool attached)`;
            }

            // 3. Default: Director Execution
            // @ts-ignore - Private/Missing method
            const result = await server.director.executeTask(input.message);
            return result;
        }),
        status: t.procedure.query(() => {
            return getMcpServer().director.getStatus();
        }),
        updateConfig: t.procedure.input(z.object({
            defaultTopic: z.string().optional()
        })).mutation(({ input }) => {
            getMcpServer().director.updateConfig(input);
            return { success: true };
        }),
        stopAutoDrive: adminProcedure.mutation(async () => {
            getMcpServer().director.stopAutoDrive();
            return "Stopped";
        }),
        startAutoDrive: adminProcedure.mutation(async () => {
            getMcpServer().executeTool('start_auto_drive', {});
            return "Started";
        })
    }),
    directorConfig: t.router({
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
    }),
    executeTool: adminProcedure.input(z.object({
        name: z.string(),
        args: z.any()
    })).mutation(async ({ input }) => {
        const result = await getMcpServer().executeTool(input.name, input.args);
        // @ts-ignore
        if (result.isError) throw new Error(result.content[0].text);
        // @ts-ignore
        return result.content[0].text;
    }),
    git: t.router({
        getModules: t.procedure.query(async () => {
            const fs = await import('fs/promises');
            const path = await import('path');
            try {
                const gitModulesPath = path.join(process.cwd(), '.gitmodules');
                const content = await fs.readFile(gitModulesPath, 'utf-8');
                const modules = [];
                const regex = /\[submodule "(.*?)"\]\s*path = (.*?)\s*url = (.*?)\s/g;
                let match;
                while ((match = regex.exec(content)) !== null) {
                    modules.push({
                        name: match[1],
                        path: match[2],
                        url: match[3],
                        status: 'unknown',
                        branch: 'main',
                        lastCommit: 'HEAD',
                        date: new Date().toISOString().split('T')[0],
                        active: false
                    });
                }
                return modules;
            } catch (e) {
                console.error("Failed to read .gitmodules", e);
                return [];
            }
        }),
        getLog: t.procedure.input(z.object({ limit: z.number().optional() })).query(async ({ input }) => {
            return getMcpServer().gitService.getLog(input.limit);
        }),
        getStatus: t.procedure.query(async () => {
            return getMcpServer().gitService.getStatus();
        }),
        revert: t.procedure.input(z.object({ hash: z.string() })).mutation(async ({ input }) => {
            return getMcpServer().gitService.revert(input.hash);
        })
    }),
    audit: t.router({
        query: t.procedure.input(z.object({ limit: z.number().optional() })).query(async ({ input }) => {
            return getMcpServer().auditService.getLogs(input.limit || 50);
        }),
        log: t.procedure.input(z.object({
            level: z.string(), agentId: z.string().optional(), action: z.string(), limit: z.number().optional()
        })).query(async ({ input }) => {
            return getMcpServer().auditService.query(input);
        })
    }),
});

export type AppRouter = typeof appRouter;

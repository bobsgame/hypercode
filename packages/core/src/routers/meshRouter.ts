import { z } from 'zod';
import { t, publicProcedure, getMeshService, getMcpServer } from '../lib/trpc-core.js';

/**
 * meshRouter
 *
 * tRPC router for Borg's P2P Mesh network (Hyperswarm).
 *
 * Exposes:
 * - `status` — Current node ID, peer count, and connected peer IDs
 * - `broadcast` — Send a raw message to all connected mesh peers
 * - `askSwarm` — Delegate a task to the Swarm via Director.delegateToSwarm()
 *     This is the user-facing entry point for Phase 62's "ask_swarm" capability.
 *     It routes the task through Director, which broadcasts a TASK_OFFER to connected
 *     specialized agents (CoderAgent, ResearcherAgent, etc.)
 */
export const meshRouter = t.router({
    /** Returns mesh network status: node ID, peer count, connected peers */
    status: publicProcedure.query(() => {
        const service = getMeshService();
        if (!service) {
            return {
                available: false,
                nodeId: null as string | null,
                peerCount: 0,
                peerIds: [] as string[],
            };
        }

        const status = service.getStatus();
        return {
            available: true,
            ...status,
        };
    }),

    /** Broadcasts a raw message type + payload to all mesh peers */
    broadcast: publicProcedure
        .input(z.object({
            type: z.string().min(1),
            payload: z.unknown().optional().default({}),
        }))
        .mutation(({ input }) => {
            const service = getMeshService();
            if (!service) {
                return { success: false, error: 'Mesh service unavailable' };
            }

            service.broadcast(input.type, input.payload);
            return { success: true };
        }),

    /**
     * ask_swarm — Phase 62 Ignition Feature
     *
     * Allows the user (or frontend) to directly submit a task to the Swarm mesh.
     * The task is routed through Director.delegateToSwarm(), which broadcasts a
     * TASK_OFFER to all connected specialized agents.
     *
     * @param task - The task description to broadcast (e.g., "Research TypeScript 6 features")
     * @param requirements - Capability requirements for the agent (e.g., ["research"], ["coding"])
     * @returns The result string from Director.delegateToSwarm()
     */
    askSwarm: publicProcedure
        .input(z.object({
            task: z.string().min(1).describe('The task to delegate to the swarm'),
            requirements: z.array(z.string()).optional().default(['Worker']).describe('Required agent capabilities'),
        }))
        .mutation(async ({ input }) => {
            const server = getMcpServer();
            if (!server) {
                return { success: false, result: 'MCP Server unavailable' };
            }

            // Access director through the server instance
            // Director is initialized in MCPServer and exposed as a property
            const director = (server as Record<string, unknown>).director;
            if (!director || typeof (director as Record<string, unknown>).delegateToSwarm !== 'function') {
                return { success: false, result: 'Director not available or delegateToSwarm not implemented' };
            }

            try {
                const result = await (director as { delegateToSwarm: (task: string, requirements: string[]) => Promise<string> })
                    .delegateToSwarm(input.task, input.requirements);
                return { success: true, result };
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                return { success: false, result: `Failed to delegate: ${msg}` };
            }
        }),
});


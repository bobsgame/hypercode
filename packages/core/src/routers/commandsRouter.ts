import { z } from 'zod';
import { t, publicProcedure } from '../lib/trpc-core.js';
import { getMcpServer } from '../lib/mcpHelper.js';

export const commandsRouter = t.router({
    execute: publicProcedure.input(z.object({
        input: z.string()
    })).mutation(async ({ input }) => {
        const mcp = getMcpServer();
        if ((mcp as any)?.commandRegistry) {
            const result = await (mcp as any).commandRegistry.execute(input.input);
            if (result) {
                return {
                    handled: result.handled,
                    output: result.output,
                    error: result.error
                };
            }
            return { handled: false, output: 'Not a command', error: null };
        }
        return { handled: false, output: 'CommandRegistry not initialized', error: 'Service unavailable' };
    }),

    list: publicProcedure.query(() => {
        const mcp = getMcpServer();
        if ((mcp as any)?.commandRegistry) {
            const commands = (mcp as any).commandRegistry.getCommands();
            return commands.map((cmd: any) => ({
                name: cmd.name,
                description: cmd.description
            }));
        }
        return [];
    }),
});


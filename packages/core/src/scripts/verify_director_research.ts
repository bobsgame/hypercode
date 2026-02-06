
import { Director } from '@borg/agents';
import { LLMService } from '@borg/ai';
import { MCPServer } from '../MCPServer.js';

// Mocks
const mockServer = {
    // @ts-ignore
    modelSelector: { selectModel: async () => ({ provider: 'mock', modelId: 'mock-model' }) },
    // @ts-ignore
    permissionManager: { getAutonomyLevel: () => 'high' },
    // @ts-ignore
    executeTool: async (name: string, args: any) => {
        console.log(`[MockServer] Tool Executed: ${name}`, args);
        if (name === 'research_recursively') {
            return {
                content: [{ type: 'text', text: 'Recursive research completed successfully.' }]
            };
        }
        return { content: [] };
    },
    // @ts-ignore
    council: { runConsensusSession: async () => ({ summary: 'Approved' }) },
    // @ts-ignore
    worktreeManager: { createTaskEnvironment: async () => '/tmp/worktree', cleanupTaskEnvironment: async () => { } }
} as unknown as MCPServer;

async function verifyDirector() {
    console.log("🎬 Verifying Director Research Heuristic...");

    const director = new Director(mockServer);

    // Mock LLM Response to trigger loop (which should fall back to heuristic)
    // OR mock LLM to return nothing so heuristic takes over
    // @ts-ignore
    director.llmService = {
        generateText: async () => { throw new Error("Force Heuristic"); }
    } as any;

    console.log("--- Test Case: 'I need to research Quantum Computing' ---");
    const taskResult = await director.executeTask("I need to research Quantum Computing", 1, 'user');

    console.log(`\nTask Result: ${taskResult}`);
}

verifyDirector().catch(console.error);

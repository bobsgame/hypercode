
import { LLMService, IAgent } from "@borg/ai";
import { PromptRegistry } from "../prompts/PromptRegistry.js";
import { EventEmitter } from 'events';

interface AgentState {
    history: { role: 'user' | 'model', parts: any[] }[];
    status: 'idle' | 'thinking' | 'acting' | 'error';
    lastError?: string;
}

export class ClaudeAgent extends EventEmitter implements IAgent {
    private llmService: LLMService;
    private promptRegistry: PromptRegistry;
    private state: AgentState;
    // Note: LLMService provider for anthropic might need mapping. 
    // Assuming 'anthropic' provider and model ID.
    private model: string = 'claude-3-5-sonnet-20240620';

    constructor(llmService: LLMService, promptRegistry: PromptRegistry) {
        super();
        this.llmService = llmService;
        this.promptRegistry = promptRegistry;
        this.state = {
            history: [],
            status: 'idle'
        };
    }

    async start() {
        console.log("[ClaudeAgent] Starting...");
        await this.promptRegistry.initialize();
        this.emit('ready');
    }

    async send(message: string, context?: any): Promise<string> {
        this.state.status = 'thinking';
        this.emit('state', this.state);

        try {
            // 1. Get System Prompt
            let systemPrompt = "You are Claude, a helpful AI assistant.";
            const template = this.promptRegistry.get('claude_core');
            if (template) {
                systemPrompt = this.promptRegistry.render('claude_core', context || {});
            }

            // 2. Add to history
            this.state.history.push({ role: 'user', parts: [{ text: message }] });

            // 3. Generate
            // Using 'anthropic' provider.
            const response = await this.llmService.generateText(
                'anthropic',
                this.model,
                systemPrompt,
                message,
                {
                    // history: this.state.history 
                }
            );

            const reply = response.content;

            this.state.history.push({ role: 'model', parts: [{ text: reply }] });
            this.state.status = 'idle';
            this.emit('output', reply);
            this.emit('state', this.state);

            return reply;

        } catch (e: any) {
            this.state.status = 'error';
            this.state.lastError = e.message;
            this.emit('error', e);
            throw e;
        }
    }

    isActive(): boolean {
        return this.state.status !== 'error';
    }

    reset() {
        this.state.history = [];
        this.state.status = 'idle';
        this.emit('state', this.state);
    }
}

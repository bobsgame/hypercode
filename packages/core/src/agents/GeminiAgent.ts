
import { LLMService, IAgent } from "@borg/ai";
import { PromptRegistry } from "../prompts/PromptRegistry.js";
import { EventEmitter } from 'events';

interface AgentState {
    history: { role: 'user' | 'model', parts: any[] }[];
    status: 'idle' | 'thinking' | 'acting' | 'error';
    lastError?: string;
}

export class GeminiAgent extends EventEmitter implements IAgent {
    private llmService: LLMService;
    private promptRegistry: PromptRegistry;
    private state: AgentState;
    private model: string = 'gemini-1.5-pro';

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
        // Initialize or load state
        console.log("[GeminiAgent] Starting...");
        await this.promptRegistry.initialize();
        this.emit('ready');
    }

    async send(message: string, context?: any): Promise<string> {
        this.state.status = 'thinking';
        this.emit('state', this.state);

        try {
            // 1. Get System Prompt
            let systemPrompt = "You are a helpful AI assistant.";
            const template = this.promptRegistry.get('gemini_core');
            if (template) {
                systemPrompt = this.promptRegistry.render('gemini_core', context || {});
            }

            // 2. Add to history
            this.state.history.push({ role: 'user', parts: [{ text: message }] });

            // 3. Generate (Simulated Chat Loop for now, LLMService handles the actual API)
            // Note: LLMService currently is stateless REST-like. 
            // Better to use a dedicated chat session if LLMService supports it, or pass full history.
            // For Phase 1 of this agent, we'll pass the message as a fresh prompt but contextualized.

            const response = await this.llmService.generateText(
                'google',
                this.model,
                systemPrompt,
                message,
                {
                    // history: this.state.history // If LLMService supported history
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
        return this.state.status !== 'error'; // Simple check
    }

    reset() {
        this.state.history = [];
        this.state.status = 'idle';
        this.emit('state', this.state);
    }
}

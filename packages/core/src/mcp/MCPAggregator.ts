import { BorgConfigLoader, BorgConfig } from "../config/BorgConfig.js";
import { StdioClient } from "./StdioClient.js";

export class MCPAggregator {
    private clients: Map<string, StdioClient> = new Map();
    private config: BorgConfig | null = null;

    constructor() { }

    public async initialize(): Promise<void> {
        console.log("[MCPAggregator] Initializing...");
        this.config = BorgConfigLoader.loadConfig();

        for (const [name, serverConfig] of Object.entries(this.config.mcpServers)) {
            if (!serverConfig.enabled) continue;

            try {
                const client = new StdioClient(name, serverConfig);
                await client.connect();
                this.clients.set(name, client);
            } catch (error) {
                console.error(`[MCPAggregator] Failed to connect to server '${name}':`, error);
            }
        }
        console.log(`[MCPAggregator] Connected to ${this.clients.size} downstream servers.`);
    }

    public async listAggregatedTools(): Promise<any[]> {
        const allTools: any[] = [];

        for (const [serverName, client] of this.clients.entries()) {
            const tools = await client.listTools();
            // Namespace tools: serverName_toolName
            const namespacedTools = tools.map((tool: any) => ({
                ...tool,
                name: `${serverName}_${tool.name}`,
                description: `[${serverName}] ${tool.description || ''}`
            }));
            allTools.push(...namespacedTools);
        }

        return allTools;
    }

    public async executeTool(name: string, args: any): Promise<any> {
        // Find which server owns this tool via prefix
        // Strategy: iterate clients and check if name starts with "clientName_"
        // This is simple but effective for now.

        for (const [serverName, client] of this.clients.entries()) {
            const prefix = `${serverName}_`;
            if (name.startsWith(prefix)) {
                const realToolName = name.slice(prefix.length);
                console.log(`[MCPAggregator] Routing '${name}' to server '${serverName}' as '${realToolName}'`);
                return await client.callTool(realToolName, args);
            }
        }

        throw new Error(`[MCPAggregator] No provider found for tool '${name}'`);
    }

    public async shutdown(): Promise<void> {
        for (const client of this.clients.values()) {
            await client.close();
        }
    }
}

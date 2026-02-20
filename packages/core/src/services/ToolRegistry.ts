import { Tool } from "@modelcontextprotocol/sdk/types.js";

export interface RegisteredTool {
    tool: Tool;
    mcpServerUuid: string;
    serverName: string;
}

class ToolRegistry {
    private tools: Map<string, RegisteredTool> = new Map();

    registerTool(tool: Tool, mcpServerUuid: string, serverName: string) {
        this.tools.set(tool.name, { tool, mcpServerUuid, serverName });
    }

    registerTools(tools: Tool[], mcpServerUuid: string, serverName: string) {
        tools.forEach(tool => this.registerTool(tool, mcpServerUuid, serverName));
    }

    getAllTools(): RegisteredTool[] {
        return Array.from(this.tools.values());
    }

    getTool(name: string): RegisteredTool | undefined {
        return this.tools.get(name);
    }

    getToolsByServer(serverName: string): RegisteredTool[] {
        return Array.from(this.tools.values()).filter(t => t.serverName === serverName);
    }

    deleteTool(name: string) {
        this.tools.delete(name);
    }

    clear() {
        this.tools.clear();
    }
}

export const toolRegistry = new ToolRegistry();

/**
 * MetaMCPBridgeService
 *
 * Provides a typed HTTP client that allows @borg/core routers to communicate
 * with the MetaMCP backend process running at http://localhost:12009.
 *
 * Architecture: MetaMCP runs as a standalone Express/tRPC service (port 12009).
 * Borg integrates with it over HTTP rather than importing its code directly,
 * which keeps module boundaries clean and allows the two systems to evolve independently.
 */
export interface MetaMCPServer {
    uuid: string;
    name: string;
    description: string | null;
    type: string;
    command: string | null;
    args: string[] | null;
    url: string | null;
    status: string;
    enabled: boolean;
}

export interface MetaMCPTool {
    uuid: string;
    name: string;
    description: string | null;
    inputSchema: Record<string, unknown> | null;
    mcp_server_uuid: string;
}

export class MetaMCPBridgeService {
    private static instance: MetaMCPBridgeService;
    private baseUrl: string;

    private constructor(port = 12009) {
        this.baseUrl = `http://localhost:${port}/trpc`;
    }

    public static getInstance(): MetaMCPBridgeService {
        if (!MetaMCPBridgeService.instance) {
            MetaMCPBridgeService.instance = new MetaMCPBridgeService();
        }
        return MetaMCPBridgeService.instance;
    }

    /** Checks if the MetaMCP backend is reachable */
    public async isAvailable(): Promise<boolean> {
        try {
            const res = await fetch(`http://localhost:12009/health`, { signal: AbortSignal.timeout(2000) });
            return res.ok;
        } catch {
            return false;
        }
    }

    /** Lists all MCP servers from MetaMCP's database */
    public async listServers(): Promise<MetaMCPServer[]> {
        try {
            const res = await fetch(`${this.baseUrl}/mcpServers.list`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(5000),
            });
            if (!res.ok) return [];
            const data = await res.json() as { result?: { data?: MetaMCPServer[] } };
            return data?.result?.data ?? [];
        } catch {
            return [];
        }
    }

    /** Lists all tools from MetaMCP's database */
    public async listTools(mcpServerUuid?: string): Promise<MetaMCPTool[]> {
        try {
            const endpoint = mcpServerUuid
                ? `${this.baseUrl}/tools.listByServer?input=${encodeURIComponent(JSON.stringify({ mcpServerUuid }))}`
                : `${this.baseUrl}/tools.list`;
            const res = await fetch(endpoint, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(5000),
            });
            if (!res.ok) return [];
            const data = await res.json() as { result?: { data?: MetaMCPTool[] } };
            return data?.result?.data ?? [];
        } catch {
            return [];
        }
    }

    /**
     * Creates a new MCP server in MetaMCP's database.
     * MetaMCP auto-discovers and connects to the server after creation.
     */
    public async createServer(server: {
        name: string;
        description?: string;
        type: 'STDIO' | 'SSE' | 'STREAMABLE_HTTP';
        command?: string;
        args?: string[];
        url?: string;
        env?: Record<string, string>;
    }): Promise<MetaMCPServer | null> {
        try {
            const res = await fetch(`${this.baseUrl}/mcpServers.create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(server),
                signal: AbortSignal.timeout(10000),
            });
            if (!res.ok) return null;
            const data = await res.json() as { result?: { data?: MetaMCPServer } };
            return data?.result?.data ?? null;
        } catch {
            return null;
        }
    }

    /**
     * Deletes an MCP server from MetaMCP's database and disconnects it.
     */
    public async deleteServer(uuid: string): Promise<boolean> {
        try {
            const res = await fetch(`${this.baseUrl}/mcpServers.delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uuid }),
                signal: AbortSignal.timeout(5000),
            });
            return res.ok;
        } catch {
            return false;
        }
    }
}

/** Singleton accessor for the MetaMCP bridge */
export const metaMCPBridge = MetaMCPBridgeService.getInstance();

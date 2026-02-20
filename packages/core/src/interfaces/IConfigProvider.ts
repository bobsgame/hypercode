export interface McpServerConfig {
    name: string;
    type: 'stdio' | 'sse';
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    disabled?: boolean;
}

export interface SavedScriptConfig {
    uuid?: string;
    name: string;
    code: string;
    description?: string | null;
}

export interface IConfigProvider {
    loadMcpServers(): Promise<McpServerConfig[]>;
    saveMcpServers(servers: McpServerConfig[]): Promise<void>;
    getSettings(): Promise<Record<string, any>>;
    loadScripts(): Promise<SavedScriptConfig[]>;
    saveScript(script: SavedScriptConfig): Promise<void>;
    deleteScript(nameOrUuid: string): Promise<void>;
}

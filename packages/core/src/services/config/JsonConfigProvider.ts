import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { IConfigProvider, McpServerConfig, SavedScriptConfig } from '../../interfaces/IConfigProvider.js';

export class JsonConfigProvider implements IConfigProvider {
    private configPath: string;
    private config: {
        mcpServers: Record<string, any>,
        scripts?: SavedScriptConfig[],
        settings?: Record<string, any>
    } = { mcpServers: {} };

    constructor(workspaceRoot: string = process.cwd()) {
        this.configPath = path.join(workspaceRoot, 'mcp.json');
    }

    async init(): Promise<void> {
        try {
            const data = await fs.readFile(this.configPath, 'utf-8');
            this.config = JSON.parse(data);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                // File doesn't exist, create default
                await this.saveConfig();
            } else {
                console.error(`Failed to load mcp.json from ${this.configPath}:`, error);
                throw error;
            }
        }
    }

    async loadMcpServers(): Promise<McpServerConfig[]> {
        await this.init(); // Reload on every access for now to catch manual edits
        const servers: McpServerConfig[] = [];

        for (const [name, config] of Object.entries(this.config.mcpServers || {})) {
            // Basic validation/transformation
            if (config.command) {
                servers.push({
                    name,
                    type: 'stdio',
                    command: config.command,
                    args: config.args,
                    env: config.env,
                    disabled: config.disabled
                });
            } else if (config.url) {
                servers.push({
                    name,
                    type: 'sse',
                    url: config.url,
                    disabled: config.disabled
                });
            }
        }

        return servers;
    }

    async saveMcpServers(servers: McpServerConfig[]): Promise<void> {
        const newMcpServers: Record<string, any> = {};

        for (const server of servers) {
            if (server.type === 'stdio') {
                newMcpServers[server.name] = {
                    command: server.command,
                    args: server.args,
                    env: server.env,
                    disabled: server.disabled
                };
            } else if (server.type === 'sse') {
                newMcpServers[server.name] = {
                    url: server.url,
                    disabled: server.disabled
                };
            }
        }

        this.config.mcpServers = newMcpServers;
        await this.saveConfig();
    }

    async getSettings(): Promise<Record<string, any>> {
        await this.init();
        return this.config;
    }

    async loadScripts(): Promise<SavedScriptConfig[]> {
        await this.init();
        return this.config.scripts || [];
    }

    async saveScript(script: SavedScriptConfig): Promise<void> {
        await this.init();
        if (!this.config.scripts) {
            this.config.scripts = [];
        }

        // Generate UUID if missing
        if (!script.uuid) {
            script.uuid = crypto.randomUUID();
        }

        const existingIndex = this.config.scripts.findIndex((s: SavedScriptConfig) =>
            s.name === script.name || (s.uuid && s.uuid === script.uuid)
        );

        if (existingIndex >= 0) {
            this.config.scripts[existingIndex] = { ...this.config.scripts[existingIndex], ...script };
        } else {
            this.config.scripts.push(script);
        }

        await this.saveConfig();
    }

    async deleteScript(nameOrUuid: string): Promise<void> {
        await this.init();
        if (!this.config.scripts) return;

        this.config.scripts = this.config.scripts.filter(s => s.name !== nameOrUuid && s.uuid !== nameOrUuid);
        await this.saveConfig();
    }

    private async saveConfig(): Promise<void> {
        await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    }
}

export const jsonConfigProvider = new JsonConfigProvider(process.cwd());

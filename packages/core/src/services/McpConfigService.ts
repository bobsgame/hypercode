
import * as fs from 'fs/promises';
import * as path from 'path';
import { mcpServersRepository } from '../db/repositories/mcp-servers.repo.js';
import { McpServerTypeEnum } from '../types/metamcp/index.js';

export class McpConfigService {
    private static MCP_JSON_PATH = path.resolve(process.cwd(), 'mcp.json');

    /**
     * Reads mcp.json and updates the database to match.
     * This makes mcp.json the authoritative source for config entry existence/content.
     */
    async syncWithDatabase() {
        console.log('[McpConfigService] Syncing Database with mcp.json...');
        try {
            let fileContent;
            try {
                fileContent = await fs.readFile(McpConfigService.MCP_JSON_PATH, 'utf-8');
            } catch (e: any) {
                if (e.code === 'ENOENT') {
                    console.log('[McpConfigService] mcp.json not found. Skipping sync.');
                    return;
                }
                throw e;
            }

            const config = JSON.parse(fileContent);
            const servers = config.mcpServers || {};

            for (const [name, serverConfig] of Object.entries(servers)) {
                // Determine type
                let type: any = 'STDIO';
                if ((serverConfig as any).url) {
                    type = 'SSE'; // Simplified assumption, could be STREAMABLE_HTTP
                }

                // Check if exists
                const existing = await mcpServersRepository.findByName(name);

                if (existing) {
                    // Update
                    await mcpServersRepository.update({
                        uuid: existing.uuid,
                        name: name, // shouldn't change
                        command: (serverConfig as any).command,
                        args: (serverConfig as any).args,
                        env: (serverConfig as any).env,
                        url: (serverConfig as any).url,
                        // Preserve other fields
                    }, { skipSync: true });
                    console.log(`[McpConfigService] Updated server: ${name}`);
                } else {
                    // Create
                    await mcpServersRepository.create({
                        name: name,
                        type: type,
                        command: (serverConfig as any).command,
                        args: (serverConfig as any).args,
                        env: (serverConfig as any).env,
                        url: (serverConfig as any).url,
                    }, { skipSync: true });
                    console.log(`[McpConfigService] Created server: ${name}`);
                }
            }
            console.log('[McpConfigService] Sync complete.');

        } catch (error) {
            console.error('[McpConfigService] Sync failed:', error);
        }
    }
}

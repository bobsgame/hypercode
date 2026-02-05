import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MCPAggregator } from '../src/mcp/MCPAggregator.js';

// Mock Dependencies
const mockListTools = vi.fn();
const mockCallTool = vi.fn();
const mockConnect = vi.fn();
const mockClose = vi.fn();

vi.mock('../src/mcp/StdioClient.js', () => {
    return {
        StdioClient: class {
            constructor(public name: string, public config: any) { }
            connect = mockConnect;
            listTools = mockListTools;
            callTool = mockCallTool;
            close = mockClose;
        }
    };
});

vi.mock('../src/config/BorgConfig.js', () => {
    return {
        BorgConfigLoader: {
            loadConfig: () => ({
                mcpServers: {
                    'test-server': {
                        command: 'echo',
                        args: ['hello'],
                        enabled: true
                    },
                    'disabled-server': {
                        command: '',
                        enabled: false
                    }
                }
            })
        }
    };
});

describe('MCPAggregator', () => {
    let aggregator: MCPAggregator;

    beforeEach(() => {
        vi.clearAllMocks();
        aggregator = new MCPAggregator();
    });

    it('initializes and connects to enabled servers', async () => {
        await aggregator.initialize();
        expect(mockConnect).toHaveBeenCalledTimes(1);
        // implicit check that it skipped disabled-server
    });

    it('lists aggregated tools with prefixes', async () => {
        mockListTools.mockResolvedValueOnce([
            { name: 'read_file', description: 'Reads a file' }
        ]);

        await aggregator.initialize();
        const tools = await aggregator.listAggregatedTools();

        expect(tools).toHaveLength(1);
        expect(tools[0].name).toBe('test-server_read_file');
        expect(tools[0].description).toContain('[test-server]');
    });

    it('routes execution to correct server', async () => {
        mockCallTool.mockResolvedValueOnce({ content: [{ text: 'success' }] });
        await aggregator.initialize();

        await aggregator.executeTool('test-server_read_file', { path: 'foo.txt' });

        expect(mockCallTool).toHaveBeenCalledWith('read_file', { path: 'foo.txt' });
    });

    it('throws error for unknown server prefix', async () => {
        await aggregator.initialize();
        await expect(aggregator.executeTool('unknown_tool', {}))
            .rejects.toThrow('No provider found');
    });
});

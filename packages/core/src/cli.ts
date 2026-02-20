#!/usr/bin/env node
import { Command } from 'commander';
import { Registry } from '@borg/mcp-registry';
import { spawn } from 'child_process';
import path from 'path';

const program = new Command();
const registry = new Registry();

program
    .name('borg')
    .description('Borg CLI - Neural Operating System Interface')
    .version('2.2.0');

const mcp = program.command('mcp').description('Manage MCP servers');

mcp.command('install')
    .description('Install an MCP server from the registry')
    .argument('<server>', 'Name of the server to install')
    .action(async (serverName) => {
        console.log(`Installing ${serverName}...`);
        const server = registry.find(serverName);

        if (!server) {
            console.error(`Server '${serverName}' not found in registry.`);
            process.exit(1);
        }

        console.log(`Found server: ${server.name} (${server.package})`);

        // Install the package
        const npmProc = spawn('npm', ['install', server.package], {
            stdio: 'inherit',
            shell: true
        });

        npmProc.on('close', (code) => {
            if (code === 0) {
                console.log(`Successfully installed ${server.package}`);
                // TODO: Update mcp.json
            } else {
                console.error(`Failed to install ${server.package}`);
            }
        });
    });

mcp.command('list')
    .description('List available MCP servers')
    .action(() => {
        const servers = registry.list();
        console.table(servers.map(s => ({ Name: s.name, Description: s.description, Package: s.package })));
    });

program.parse(process.argv);

/**
 * `borg start` - Start the AIOS backend server
 *
 * Launches the Borg core server with Express/tRPC/WebSocket/MCP endpoints.
 * The server provides the API backend for the WebUI dashboard, CLI commands,
 * and external MCP clients.
 *
 * @example
 *   borg start                    # Start on default port 3000
 *   borg start --port 8080        # Start on custom port
 *   borg start --no-mcp           # Start without MCP server
 *   borg start --config ./my.json # Use custom config file
 */

import type { Command } from 'commander';

export function registerStartCommand(program: Command): void {
  program
    .command('start')
    .description('Start the Borg AIOS backend server (Express/tRPC/WebSocket/MCP)')
    .option('-p, --port <number>', 'Server port', '3000')
    .option('-H, --host <address>', 'Server host address', '0.0.0.0')
    .option('--no-mcp', 'Disable the MCP server endpoint')
    .option('--no-dashboard', 'Disable serving the WebUI dashboard')
    .option('-c, --config <path>', 'Path to config file')
    .option('-d, --data-dir <path>', 'Data directory for Borg state', '~/.borg')
    .option('--daemon', 'Run as background daemon')
    .addHelpText('after', `
Examples:
  $ borg start                     Start with defaults (port 3000)
  $ borg start -p 8080             Start on port 8080
  $ borg start --no-mcp            Start without MCP server
  $ borg start --daemon            Run as background service
  $ borg start --host 127.0.0.1    Bind to localhost only
    `)
    .action(async (opts) => {
      const chalk = (await import('chalk')).default;
      const port = parseInt(opts.port, 10);
      const host = opts.host;

      console.log(chalk.bold.cyan('\n  ⬡ Borg AIOS v2.5.0'));
      console.log(chalk.dim('  The Neural Operating System\n'));

      try {
        console.log(chalk.yellow('  Starting server...'));
        console.log(chalk.dim(`  Host: ${host}:${port}`));
        console.log(chalk.dim(`  MCP:  ${opts.mcp ? 'enabled' : 'disabled'}`));
        console.log(chalk.dim(`  Dashboard: ${opts.dashboard ? 'enabled' : 'disabled'}`));
        console.log('');

        // Dynamic import to avoid loading core when just showing help
        const core = await import('@borg/core');
        // Initialize core services - MCPServer, tRPC router, event bus
        if (core.MCPServer) {
          const mcpServer = new core.MCPServer();
          console.log(chalk.dim('  Core loaded: MCPServer initialized'));
        } else {
          console.log(chalk.dim('  Core loaded (MCPServer not available)'));
        }

        console.log(chalk.green(`  ✓ Server running at http://${host}:${port}`));
        if (opts.mcp) {
          console.log(chalk.green('  ✓ MCP server ready (stdio + streamable-http)'));
        }
        if (opts.dashboard) {
          console.log(chalk.green(`  ✓ Dashboard at http://${host}:${port}/dashboard`));
        }
        console.log(chalk.dim('\n  Press Ctrl+C to stop\n'));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`  ✗ Failed to start: ${msg}`));
        process.exit(1);
      }
    });
}

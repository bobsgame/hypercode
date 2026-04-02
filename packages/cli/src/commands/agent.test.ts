import { afterEach, describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';

const queryTrpcMock = vi.fn();
const resolveControlPlaneLocationMock = vi.fn(() => ({
  source: 'default',
  baseUrl: 'http://127.0.0.1:4000/trpc',
  host: '127.0.0.1',
  port: 4000,
}));

vi.mock('../control-plane.js', () => ({
  queryTrpc: (...args: unknown[]) => queryTrpcMock(...args),
  resolveControlPlaneLocation: () => resolveControlPlaneLocationMock(),
}));

import { registerAgentCommand } from './agent.js';

const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

afterEach(() => {
  queryTrpcMock.mockReset();
  resolveControlPlaneLocationMock.mockClear();
  logSpy.mockClear();
  errorSpy.mockClear();
  process.exitCode = 0;
});

function createProgram(): Command {
  const program = new Command();
  registerAgentCommand(program);
  return program;
}

describe('registerAgentCommand', () => {
  it('shows live council status as JSON', async () => {
    queryTrpcMock
      .mockResolvedValueOnce({ status: 'running' })
      .mockResolvedValueOnce({
        isActive: true,
        activeWorkers: ['worker-1'],
        queueDepth: 2,
        lastActivity: '2026-04-02T09:00:00.000Z',
        totalTasksCompleted: 12,
      })
      .mockResolvedValueOnce({
        enabled: true,
        supervisorCount: 3,
        availableCount: 5,
      });

    const program = createProgram();
    await program.parseAsync(['agent', 'council', '--status', '--json'], { from: 'user' });

    expect(queryTrpcMock).toHaveBeenNthCalledWith(1, 'director.status');
    expect(queryTrpcMock).toHaveBeenNthCalledWith(2, 'supervisor.status');
    expect(queryTrpcMock).toHaveBeenNthCalledWith(3, 'council.status');
    expect(logSpy).toHaveBeenCalledWith(JSON.stringify({
      director: { status: 'running' },
      supervisor: {
        isActive: true,
        activeWorkers: ['worker-1'],
        queueDepth: 2,
        lastActivity: '2026-04-02T09:00:00.000Z',
        totalTasksCompleted: 12,
      },
      council: {
        enabled: true,
        supervisorCount: 3,
        availableCount: 5,
      },
    }, null, 2));
  });

  it('reports control-plane failures without throwing out of the command', async () => {
    queryTrpcMock.mockRejectedValue(new Error('control plane unavailable'));

    const program = createProgram();
    await program.parseAsync(['agent', 'council', '--status'], { from: 'user' });

    expect(errorSpy).toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });
});

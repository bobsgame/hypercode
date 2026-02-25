"use client";

import { trpc } from '@/utils/trpc';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@borg/ui';
import { Activity, Cpu, HardDrive, AlertTriangle, Clock, Server, MonitorPlay } from 'lucide-react';

function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function SystemPulse() {
    // Polling System Pulse
    const { data: status } = trpc.pulse.getSystemStatus.useQuery(undefined, { refetchInterval: 5000 });
    const { data: metrics } = trpc.metrics.systemSnapshot.useQuery(undefined, { refetchInterval: 5000 });
    const { data: logs } = trpc.logs.summary.useQuery({ limit: 1000 }, { refetchInterval: 5000 });
    const { data: events } = trpc.pulse.getLatestEvents.useQuery({ limit: 50 }, { refetchInterval: 2000 });

    const uptimeStr = metrics
        ? `${Math.floor(metrics.process.uptimeSeconds / 3600)}h ${Math.floor((metrics.process.uptimeSeconds % 3600) / 60)}m`
        : '--';

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Borg Core Status</CardTitle>
                        {status?.status === 'online' ? (
                            <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Online</Badge>
                        ) : (
                            <Badge variant="destructive">Offline</Badge>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(status as any)?.agents?.length || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-cyan-500">Active Agents</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uptimeStr}</div>
                        <p className="text-xs text-muted-foreground mt-1">PID: {metrics?.process?.pid || '--'}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics ? `${metrics.system.memoryUsagePercent}%` : '--'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {metrics ? `${formatBytes(metrics.system.usedMemory)} / ${formatBytes(metrics.system.totalMemory)}` : '--'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Node.js Heap</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics ? formatBytes(metrics.process.heapUsed) : '--'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            of {metrics ? formatBytes(metrics.process.heapTotal) : '--'} total
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-t pt-6 border-zinc-200 dark:border-zinc-800">
                <div className="lg:col-span-2 space-y-4">
                    <Card className="h-[500px] flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-500" />
                                Live Event Stream
                            </CardTitle>
                            <Badge variant="secondary" className="font-mono">{events?.length || 0} Events</Badge>
                        </CardHeader>
                        <CardContent className="flex-1 bg-zinc-950 p-4 overflow-y-auto font-mono text-sm space-y-3">
                            {!events || events.length === 0 ? (
                                <div className="text-zinc-500 italic flex items-center gap-2 h-full justify-center">
                                    <MonitorPlay className="h-4 w-4" /> Waiting for events...
                                </div>
                            ) : (
                                events.map((event: any, idx: number) => (
                                    <div key={idx} className="flex gap-3 border-l-2 border-zinc-800 pl-3 py-1">
                                        <div className="text-zinc-500 flex-shrink-0 w-20">
                                            {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-blue-400 font-bold mr-2">[{event.type}]</span>
                                            <span className="text-zinc-300">{event.payload?.message || JSON.stringify(event.payload)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card className="h-[500px] flex flex-col">
                        <CardHeader className="border-b pb-2">
                            <CardTitle className="text-sm font-medium">Top Tools (Last 1k Calls)</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-0">
                            {logs?.topTools?.map((tool: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{tool.name}</span>
                                        <span className="text-xs text-muted-foreground">{tool.count} calls</span>
                                    </div>
                                    {tool.errors > 0 ? (
                                        <Badge variant="destructive" className="flex gap-1 items-center">
                                            <AlertTriangle className="h-3 w-3" />
                                            {tool.errors} err
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                                            100% OK
                                        </Badge>
                                    )}
                                </div>
                            ))}
                            {!logs?.topTools?.length && (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    No tools used yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

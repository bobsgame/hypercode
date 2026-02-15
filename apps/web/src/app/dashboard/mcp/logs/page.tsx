"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@borg/ui";
import { Button } from "@borg/ui";
import { Loader2, Activity, Play, Pause, Trash2, Filter } from "lucide-react";
import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';

export default function LogsDashboard() {
    const [isLive, setIsLive] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);

    // Polling for live logs
    const { data: latestLogs, error } = trpc.logs.list.useQuery(
        { limit: 100 },
        {
            refetchInterval: isLive ? 2000 : false,
            // On each fetch, merge/update logs. simple replace for now.
        }
    );

    const clearMutation = trpc.logs.clear.useMutation({
        onSuccess: () => {
            toast.success("Logs cleared");
            setLogs([]);
        },
    });

    return (
        <div className="p-8 space-y-8 h-full flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Live Logs</h1>
                    <p className="text-zinc-500">
                        Real-time stream of MCP tool executions and system events
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setIsLive(!isLive)}
                        variant="outline"
                        className={`border-zinc-700 hover:bg-zinc-800 ${isLive ? 'text-green-400' : 'text-zinc-400'}`}
                    >
                        {isLive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        {isLive ? 'Live' : 'Paused'}
                    </Button>
                    <Button
                        onClick={() => clearMutation.mutate()}
                        variant="outline"
                        className="border-zinc-700 hover:bg-zinc-800 text-red-400 hover:text-red-300"
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> Clear
                    </Button>
                </div>
            </div>

            <Card className="bg-zinc-950 border-zinc-800 flex-1 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-zinc-900 bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-500">
                    <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3" />
                        <span>Stream attached</span>
                    </div>
                    <span>{latestLogs?.length || 0} entries</span>
                </div>
                <div className="flex-1 overflow-auto p-4 font-mono text-sm space-y-1">
                    {(latestLogs || []).length === 0 ? (
                        <div className="h-full flex items-center justify-center text-zinc-600 italic">
                            No logs captured
                        </div>
                    ) : (latestLogs || []).map((log: any) => (
                        <LogEntry key={log.id} log={log} />
                    ))}
                </div>
            </Card>
        </div>
    );
}

function LogEntry({ log }: { log: any }) {
    const isError = log.level === 'error' || !!log.error;

    return (
        <div className={`p-2 rounded hover:bg-zinc-900/50 transition-colors border-l-2 ${isError ? 'border-red-500 bg-red-500/5' : 'border-blue-500/50'}`}>
            <div className="flex items-start gap-3">
                <div className="text-zinc-500 text-xs shrink-0 pt-0.5 w-20">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isError ? 'text-red-400' : 'text-blue-400'}`}>
                            {log.toolName || 'System'}
                        </span>
                        {log.durationMs && (
                            <span className="text-zinc-600 text-xs">
                                {log.durationMs}ms
                            </span>
                        )}
                    </div>

                    {/* Arguments */}
                    {log.arguments && Object.keys(log.arguments).length > 0 && (
                        <div className="text-zinc-400 text-xs break-all">
                            <span className="text-zinc-600 mr-1">$</span>
                            {JSON.stringify(log.arguments)}
                        </div>
                    )}

                    {/* Result or Error */}
                    {log.error ? (
                        <div className="text-red-400 text-xs mt-1 bg-red-500/10 p-1 rounded">
                            {log.error}
                        </div>
                    ) : log.result ? (
                        <div className="text-zinc-500 text-xs mt-1 truncate opacity-70">
                            {'> ' + JSON.stringify(log.result)}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@borg/ui";
import { trpc } from '@/utils/trpc';
import { Loader2, Activity, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'; // Assuming Recharts is available or we stub it

// Quick stub if Recharts isn't installed, but let's assume standard stack.
// If it fails securely, we'll swap to simple CSS bars.

export default function ObservabilityDashboard() {
    const { data: logs, isLoading } = trpc.logs.list.useQuery({ limit: 1000 });

    // Process logs for metrics
    const totalCalls = logs?.length || 0;
    const errorCount = logs?.filter((l: any) => l.level === 'error' || l.error).length || 0;
    const errorRate = totalCalls > 0 ? ((errorCount / totalCalls) * 100).toFixed(1) : '0';

    const durationSum = logs?.reduce((acc: number, l: any) => acc + (Number(l.durationMs) || 0), 0) || 0;
    const avgDuration = totalCalls > 0 ? (durationSum / totalCalls).toFixed(0) : '0';

    // Group by tool
    const toolStats = (logs || []).reduce((acc: any, log: any) => {
        const name = log.toolName || 'unknown';
        if (!acc[name]) acc[name] = { name, count: 0, errors: 0 };
        acc[name].count++;
        if (log.level === 'error' || log.error) acc[name].errors++;
        return acc;
    }, {});

    const topTools = Object.values(toolStats).sort((a: any, b: any) => b.count - a.count).slice(0, 5);

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Observability</h1>
                    <p className="text-zinc-500">
                        Metrics and analytics for MCP tool usage
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <MetricCard
                    title="Total Calls"
                    value={totalCalls.toString()}
                    icon={Activity}
                    trend="Last 1000 logs"
                />
                <MetricCard
                    title="Error Rate"
                    value={`${errorRate}%`}
                    icon={AlertTriangle}
                    color="text-red-500"
                    trend={`${errorCount} errors`}
                />
                <MetricCard
                    title="Avg Latency"
                    value={`${avgDuration}ms`}
                    icon={Clock}
                    color="text-yellow-500"
                />
                <MetricCard
                    title="Success Rate"
                    value={`${(100 - Number(errorRate)).toFixed(1)}%`}
                    icon={CheckCircle2}
                    color="text-green-500"
                />
            </div>

            {/* Charts Area */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-zinc-200">Top Tools by Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-64 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {(topTools as any[]).map((tool) => (
                                    <div key={tool.name} className="space-y-1">
                                        <div className="flex justify-between text-xs text-zinc-400">
                                            <span>{tool.name}</span>
                                            <span>{tool.count} calls</span>
                                        </div>
                                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full"
                                                style={{ width: `${(tool.count / totalCalls) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {topTools.length === 0 && <div className="text-zinc-500 text-center py-10">No data available</div>}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-zinc-200">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-end gap-2 p-4 border-b border-l border-zinc-800 border-dashed">
                            {/* Simple CSS Histogram if Recharts is missing/complex to setup via single-file */}
                            {(logs || []).slice(0, 20).reverse().map((log: any, i: number) => (
                                <div key={i} className="flex-1 flex flex-col justify-end group relative">
                                    <div
                                        className={`w-full rounded-t ${log.error ? 'bg-red-500/50' : 'bg-blue-500/50'} hover:opacity-80 transition-all`}
                                        style={{ height: `${Math.min(100, (Number(log.durationMs) || 10) / 10)}%`, minHeight: '4px' }}
                                    ></div>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black border border-zinc-800 text-[10px] p-1 rounded hidden group-hover:block whitespace-nowrap z-10">
                                        {log.toolName} ({log.durationMs}ms)
                                    </div>
                                </div>
                            ))}
                            {(logs || []).length === 0 && <div className="w-full text-center text-zinc-500 self-center">No recent activity</div>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon, color = "text-blue-500", trend }: any) {
    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-zinc-400">{title}</p>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="text-2xl font-bold text-white">{value}</div>
                {trend && <p className="text-xs text-zinc-500 mt-1">{trend}</p>}
            </CardContent>
        </Card>
    );
}

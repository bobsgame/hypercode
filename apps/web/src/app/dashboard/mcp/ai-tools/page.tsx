"use client";

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@borg/ui';
import { Bot, CheckCircle2, KeyRound, Loader2, Search, Server, Wrench, XCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';

export default function AIToolsDashboard() {
    const [query, setQuery] = useState('');
    const [healthServerUuid, setHealthServerUuid] = useState('');

    const { data: tools, isLoading: loadingTools } = trpc.tools.list.useQuery();
    const { data: servers, isLoading: loadingServers } = trpc.mcpServers.list.useQuery();
    const { data: apiKeys, isLoading: loadingKeys } = trpc.apiKeys.list.useQuery();
    const { data: expertStatus } = trpc.expert.getStatus.useQuery();
    const { data: sessionState } = trpc.session.getState.useQuery();
    const { data: memoryStats } = trpc.agentMemory.stats.useQuery();
    const { data: shellHistory } = trpc.shell.getSystemHistory.useQuery({ limit: 8 });
    const { data: serverHealth } = trpc.serverHealth.check.useQuery(
        { serverUuid: healthServerUuid },
        { enabled: healthServerUuid.trim().length > 0 }
    );

    const normalized = query.trim().toLowerCase();

    const filteredTools = useMemo(() => {
        const source = tools ?? [];
        if (!normalized) {
            return source;
        }

        return source.filter((tool: any) => {
            const name = String(tool?.name ?? '').toLowerCase();
            const description = String(tool?.description ?? '').toLowerCase();
            const server = String(tool?.server ?? '').toLowerCase();
            return name.includes(normalized) || description.includes(normalized) || server.includes(normalized);
        });
    }, [normalized, tools]);

    const activeServers = useMemo(() => {
        return (servers ?? []).filter((server: any) => server?.error_status === 'NONE');
    }, [servers]);

    const firstServerUuid = useMemo(() => {
        const first = (servers ?? [])[0] as any;
        return typeof first?.uuid === 'string' ? first.uuid : '';
    }, [servers]);

    const effectiveHealthServerUuid = healthServerUuid || firstServerUuid;

    const activeKeys = useMemo(() => {
        return (apiKeys ?? []).filter((key: any) => Boolean(key?.is_active));
    }, [apiKeys]);

    const loading = loadingTools || loadingServers || loadingKeys;

    return (
        <div className="p-8 space-y-8 h-full overflow-y-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">AI Tools</h1>
                    <p className="text-zinc-500">Unified operational view of tool inventory, server health, and key readiness.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Tools Indexed" value={String(tools?.length ?? 0)} icon={Wrench} tone="text-blue-400" />
                <StatCard title="Active Servers" value={`${activeServers.length}/${servers?.length ?? 0}`} icon={Server} tone="text-emerald-400" />
                <StatCard title="Active API Keys" value={`${activeKeys.length}/${apiKeys?.length ?? 0}`} icon={KeyRound} tone="text-yellow-400" />
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">Search Tool Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Filter by tool name, description, or server"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2.5 pl-9 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">Tool List ({filteredTools.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center p-12 text-zinc-500 gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading AI tools dashboard...
                        </div>
                    ) : filteredTools.length === 0 ? (
                        <div className="text-center p-10 text-zinc-500 border border-zinc-800 border-dashed rounded-lg bg-zinc-950/40">
                            <Bot className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">No tools match your filter.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredTools.map((tool: any) => (
                                <div
                                    key={tool.uuid ?? `${tool.name}-${tool.server}`}
                                    className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3 flex items-start justify-between gap-3"
                                >
                                    <div className="min-w-0">
                                        <div className="text-sm font-mono text-blue-300 truncate">{tool.name}</div>
                                        <div className="text-xs text-zinc-400 mt-1 line-clamp-2">{tool.description || 'No description'}</div>
                                    </div>
                                    <div className="text-[10px] px-2 py-0.5 rounded border border-zinc-700 text-zinc-400 bg-zinc-900 whitespace-nowrap">
                                        {tool.server || 'unknown-server'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReadinessCard
                    title="Server Readiness"
                    healthyCount={activeServers.length}
                    totalCount={servers?.length ?? 0}
                    healthyLabel="Connected"
                    unhealthyLabel="Issues"
                />
                <ReadinessCard
                    title="API Key Readiness"
                    healthyCount={activeKeys.length}
                    totalCount={apiKeys?.length ?? 0}
                    healthyLabel="Active"
                    unhealthyLabel="Inactive"
                />
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">Namespace Coverage (Live)</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    <NamespaceCard
                        title="expert.getStatus"
                        lines={[
                            `researcher: ${String(expertStatus?.researcher ?? 'unknown')}`,
                            `coder: ${String(expertStatus?.coder ?? 'unknown')}`,
                        ]}
                    />

                    <NamespaceCard
                        title="session.getState"
                        lines={[
                            `autoDrive: ${String((sessionState as any)?.isAutoDriveActive ?? false)}`,
                            `activeGoal: ${String((sessionState as any)?.activeGoal ?? 'none')}`,
                        ]}
                    />

                    <NamespaceCard
                        title="agentMemory.stats"
                        lines={[
                            `session: ${String(memoryStats?.session ?? 0)}`,
                            `working: ${String(memoryStats?.working ?? 0)}`,
                            `longTerm: ${String(memoryStats?.longTerm ?? 0)}`,
                            `total: ${String(memoryStats?.total ?? 0)}`,
                        ]}
                    />

                    <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3 xl:col-span-2">
                        <div className="text-sm text-zinc-200 font-medium mb-2">serverHealth.check</div>
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                value={healthServerUuid}
                                onChange={(e) => setHealthServerUuid(e.target.value)}
                                placeholder={firstServerUuid ? `default: ${firstServerUuid}` : 'enter server UUID'}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 outline-none focus:border-zinc-500"
                            />
                        </div>
                        {effectiveHealthServerUuid ? (
                            <div className="text-xs text-zinc-300 space-y-1">
                                <div>status: {String(serverHealth?.status ?? 'loading')}</div>
                                <div>crashCount: {String(serverHealth?.crashCount ?? 0)}</div>
                                <div>maxAttempts: {String(serverHealth?.maxAttempts ?? 0)}</div>
                                <div className="text-zinc-500 break-all">uuid: {effectiveHealthServerUuid}</div>
                            </div>
                        ) : (
                            <div className="text-xs text-zinc-500">No server UUID available yet.</div>
                        )}
                    </div>

                    <NamespaceCard
                        title="shell.getSystemHistory"
                        lines={[
                            `entries: ${String(shellHistory?.length ?? 0)}`,
                            ...(shellHistory && shellHistory.length > 0
                                ? [`last: ${String((shellHistory[0] as any)?.command ?? 'n/a').slice(0, 60)}`]
                                : ['last: n/a']),
                        ]}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

function NamespaceCard({ title, lines }: { title: string; lines: string[] }) {
    return (
        <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3">
            <div className="text-sm text-zinc-200 font-medium mb-2">{title}</div>
            <div className="space-y-1 text-xs text-zinc-300">
                {lines.map((line) => (
                    <div key={line} className="break-all">{line}</div>
                ))}
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    tone,
}: {
    title: string;
    value: string;
    icon: any;
    tone: string;
}) {
    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-zinc-500 text-sm">{title}</span>
                    <Icon className={`h-4 w-4 ${tone}`} />
                </div>
                <div className="text-2xl font-bold text-white">{value}</div>
            </CardContent>
        </Card>
    );
}

function ReadinessCard({
    title,
    healthyCount,
    totalCount,
    healthyLabel,
    unhealthyLabel,
}: {
    title: string;
    healthyCount: number;
    totalCount: number;
    healthyLabel: string;
    unhealthyLabel: string;
}) {
    const unhealthy = Math.max(0, totalCount - healthyCount);

    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-white text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex items-center justify-between rounded border border-zinc-800 p-2 bg-zinc-950/50">
                    <span className="text-zinc-400 text-sm">{healthyLabel}</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-sm">
                        <CheckCircle2 className="h-4 w-4" /> {healthyCount}
                    </span>
                </div>
                <div className="flex items-center justify-between rounded border border-zinc-800 p-2 bg-zinc-950/50">
                    <span className="text-zinc-400 text-sm">{unhealthyLabel}</span>
                    <span className="inline-flex items-center gap-1 text-red-400 text-sm">
                        <XCircle className="h-4 w-4" /> {unhealthy}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

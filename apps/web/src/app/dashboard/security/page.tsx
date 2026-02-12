
'use client';

import React, { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield, Activity, Lock } from 'lucide-react';

export default function SecurityPage() {
    const [auditLimit, setAuditLimit] = useState(50);
    const { data: auditLogs, isLoading: loadingLogs, refetch: refetchLogs } = trpc.audit.query.useQuery({ limit: auditLimit });
    // Policy router is currently disabled — using static data
    const policies: any[] = [];
    const loadingPolicies = false;
    const { data: autonomyLevel } = trpc.autonomy.getLevel.useQuery();

    const [lockdownPending, setLockdownPending] = useState(false);


    return (
        <div className="p-6 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Security & Governance</h1>
                    <p className="text-muted-foreground">Manage permissions, policies, and view audit logs.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Badge variant={autonomyLevel === 'high' ? 'destructive' : 'secondary'} className="text-md px-3 py-1">
                        Autonomy: {autonomyLevel?.toUpperCase()}
                    </Badge>
                    {/* Lockdown Button */}
                    <Button
                        variant="destructive"
                        disabled={true}
                        title="Policy router not active"
                    >
                        <Lock className="w-4 h-4 mr-2" />
                        SYSTEM LOCKDOWN
                    </Button>
                </div>
            </header>

            <Tabs defaultValue="audit" className="w-full">
                <TabsList>
                    <TabsTrigger value="audit">Audit Logs</TabsTrigger>
                    <TabsTrigger value="policies">Policies</TabsTrigger>
                </TabsList>

                {/* AUDIT LOGS TAB */}
                <TabsContent value="audit" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>System Audit Log</CardTitle>
                                <CardDescription>Real-time record of all agent actions and tool executions.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => refetchLogs()}>Refresh</Button>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                                {loadingLogs ? <div>Loading logs...</div> : (
                                    <div className="space-y-4">
                                        {auditLogs?.map((log: any, i: number) => (
                                            <div key={i} className="flex flex-col gap-1 border-b pb-2 last:border-0">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground font-mono">
                                                            {new Date(log.timestamp).toLocaleTimeString()}
                                                        </span>
                                                        <Badge variant={
                                                            log.level === 'WARN' ? 'secondary' :
                                                                log.level === 'ERROR' ? 'destructive' : 'outline'
                                                        }>
                                                            {log.level}
                                                        </Badge>
                                                        <span className="font-semibold text-sm">{log.action}</span>
                                                    </div>
                                                </div>
                                                <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto">
                                                    {typeof log.params === 'string' ? log.params : JSON.stringify(log.params, null, 2)}
                                                </pre>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* POLICIES TAB */}
                <TabsContent value="policies" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Policies</CardTitle>
                            <CardDescription>Rules governing tool execution and resource access.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingPolicies ? <div>Loading policies...</div> : (
                                <div className="grid gap-4">
                                    {policies?.map((policy: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                            <div className="flex items-center gap-4">
                                                <Shield className="w-5 h-5 text-primary" />
                                                <div>
                                                    <h3 className="font-medium">{policy.toolName}</h3>
                                                    <p className="text-sm text-muted-foreground">{policy.description || "No description provided."}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline">Active</Badge>
                                        </div>
                                    ))}
                                    {policies?.length === 0 && <div className="text-muted-foreground">No active policies found. Default Allow mode active.</div>}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

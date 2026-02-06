
'use client';

import React from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Wrench } from 'lucide-react';

export default function HealerPage() {
    const { data: history, isLoading, refetch } = trpc.healer.getHistory.useQuery();

    return (
        <div className="p-6 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">The Healer</h1>
                    <p className="text-muted-foreground">Self-Correction History and Auto-Fix Queues.</p>
                </div>
                <Button variant="outline" onClick={() => refetch()}>Refresh History</Button>
            </header>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Auto-Fix History</CardTitle>
                        <CardDescription>Errors detected and attempts made to heal them.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                            {isLoading ? <div>Loading history...</div> : (
                                <div className="space-y-4">
                                    {history?.map((entry: any, i: number) => (
                                        <div key={i} className="flex flex-col gap-2 border-b pb-4 last:border-0">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    {entry.success ?
                                                        <CheckCircle className="w-5 h-5 text-green-500" /> :
                                                        <Wrench className="w-5 h-5 text-yellow-500" />
                                                    }
                                                    <span className="font-semibold text-sm">
                                                        {new Date(entry.timestamp).toLocaleString()}
                                                    </span>
                                                    <Badge variant={entry.success ? 'default' : 'secondary'}>
                                                        {entry.success ? 'FIXED' : 'PENDING'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="text-sm font-mono bg-muted/50 p-2 rounded text-red-400">
                                                {entry.error.split('\n')[0]}
                                            </div>
                                            {entry.fix && (
                                                <div className="pl-4 border-l-2 border-muted mt-2">
                                                    <p className="text-sm font-semibold">Diagnosis: {entry.fix.diagnosis.errorType}</p>
                                                    <p className="text-xs text-muted-foreground">{entry.fix.diagnosis.description}</p>
                                                    <div className="mt-2 text-xs bg-slate-900 p-2 rounded text-green-400 font-mono overflow-x-auto">
                                                        {entry.fix.explanation}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {history?.length === 0 && <div className="text-muted-foreground text-center py-8">No self-correction events yet.</div>}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

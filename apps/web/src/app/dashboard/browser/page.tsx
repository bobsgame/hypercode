"use client";

import { Card, CardHeader, CardTitle, CardContent, Button } from "@borg/ui";
import { Loader2, Globe, Trash2, XCircle, Activity, ExternalLink, Zap } from "lucide-react";
import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';

export default function BrowserDashboard() {
    const { data: status, isLoading, refetch } = trpc.browser.status.useQuery(undefined, { refetchInterval: 3000 });

    const closePageMutation = trpc.browser.closePage.useMutation({
        onSuccess: () => {
            toast.success("Page closed");
            refetch();
        },
        onError: (err) => {
            toast.error(`Failed to close page: ${err.message}`);
        }
    });

    const closeAllMutation = trpc.browser.closeAll.useMutation({
        onSuccess: () => {
            toast.success("All browser sessions closed");
            refetch();
        },
        onError: (err) => {
            toast.error(`Failed to close all: ${err.message}`);
        }
    });

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Globe className="h-8 w-8 text-blue-400" />
                        Semantic Browser
                    </h1>
                    <p className="text-zinc-500 mt-2">
                        Monitor and manage autonomous headless browser sessions
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg">
                        <Activity className={`h-5 w-5 ${status?.active ? 'text-green-500' : 'text-zinc-600'}`} />
                        <span className="text-sm font-medium text-zinc-300">
                            {isLoading ? 'Loading...' : status?.active ? 'Browser Active' : 'Idle'}
                        </span>
                    </div>
                    {status?.active && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => { if(confirm("Close all sessions?")) closeAllMutation.mutate(); }}
                            disabled={closeAllMutation.isPending}
                        >
                            <XCircle className="mr-2 h-4 w-4" /> Stop All
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider text-muted-foreground">Open Pages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">
                            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : status?.pageCount || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Pages List */}
            <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
                <CardHeader className="border-b border-zinc-800 bg-zinc-900/50">
                    <CardTitle className="text-lg font-bold text-blue-400 flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Active Viewports
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                        </div>
                    ) : !status?.active || (status.pageIds?.length ?? 0) === 0 ? (
                        <div className="p-16 text-center text-zinc-500">
                            <Globe className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg">No active browser sessions.</p>
                            <p className="text-sm mt-1 text-zinc-600 font-mono">The browser service is ready for agent deployment.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {status.pageIds?.map((id: string) => (
                                <div key={id} className="p-4 flex justify-between items-center hover:bg-zinc-800/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                            <Globe className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                                                Page ID: {id.slice(0, 8)}...
                                                <span className="px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] uppercase font-bold border border-green-500/20">Live</span>
                                            </div>
                                            <div className="text-xs text-zinc-500 mt-1 font-mono">
                                                Managed Viewport
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-zinc-400 hover:text-red-400"
                                            onClick={() => closePageMutation.mutate({ pageId: id })}
                                            disabled={closePageMutation.isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <Card className="bg-blue-900/10 border-blue-500/20">
                    <CardHeader>
                        <CardTitle className="text-blue-400 text-sm flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Computer-Use Integration
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            The Semantic Browser provides agents with a high-fidelity window into web applications. 
                            It supports element interaction, accessibility tree traversal, and visual verification.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

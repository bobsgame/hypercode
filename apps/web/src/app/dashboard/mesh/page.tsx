"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from "@borg/ui";
import { Loader2, Network, Send, Zap, Users, Activity } from "lucide-react";
import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';

export default function MeshDashboard() {
    const { data: status, isLoading, refetch } = trpc.mesh.status.useQuery(undefined, { refetchInterval: 5000 });
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [swarmTask, setSwarmTask] = useState('');

    const broadcastMutation = trpc.mesh.broadcast.useMutation({
        onSuccess: () => {
            toast.success("Message broadcasted to Swarm");
            setBroadcastMsg('');
        },
        onError: (err) => {
            toast.error(`Broadcast failed: ${err.message}`);
        }
    });

    const askSwarmMutation = trpc.mesh.askSwarm.useMutation({
        onSuccess: (data) => {
            if (data.success) {
                toast.success("Task delegated to Swarm");
            } else {
                toast.error(`Swarm delegation issue: ${data.result}`);
            }
            setSwarmTask('');
        },
        onError: (err) => {
            toast.error(`Failed to ask Swarm: ${err.message}`);
        }
    });

    const handleBroadcast = (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastMsg.trim()) return;
        broadcastMutation.mutate({ type: 'USER_BROADCAST', payload: { message: broadcastMsg } });
    };

    const handleAskSwarm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!swarmTask.trim()) return;
        askSwarmMutation.mutate({ task: swarmTask, requirements: ['Worker'] });
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Network className="h-8 w-8 text-blue-500" />
                        Mesh Control Center
                    </h1>
                    <p className="text-zinc-500 mt-2">
                        Monitor P2P node connections and dispatch tasks to the AI Hive Mind
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg">
                    <Activity className={`h-5 w-5 ${status?.available ? 'text-green-500' : 'text-red-500'}`} />
                    <span className="text-sm font-medium text-zinc-300">
                        {isLoading ? 'Connecting...' : status?.available ? 'Mesh Active' : 'Mesh Offline'}
                    </span>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Node ID</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-white truncate" title={status?.nodeId || 'N/A'}>
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-zinc-500" /> : status?.nodeId || 'Disconnected'}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Connected Peers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-400 flex items-center gap-2">
                            <Users className="h-6 w-6" />
                            {isLoading ? '-' : status?.peerCount || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ask Swarm Panel */}
                <Card className="bg-zinc-900 border-zinc-800 border-t-4 border-t-purple-500 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-purple-400 flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Ask the Swarm
                        </CardTitle>
                        <p className="text-xs text-zinc-500">Delegate tasks to specialized agents across the network.</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAskSwarm} className="space-y-4">
                            <textarea
                                value={swarmTask}
                                onChange={e => setSwarmTask(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-3 text-sm text-white h-24 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
                                placeholder="e.g., Research new features in Next.js 15..."
                                disabled={!status?.available || askSwarmMutation.isPending}
                            />
                            <div className="flex justify-end">
                                <Button 
                                    type="submit" 
                                    disabled={!status?.available || askSwarmMutation.isPending || !swarmTask.trim()} 
                                    className="bg-purple-600 hover:bg-purple-500 text-white font-medium"
                                >
                                    {askSwarmMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Dispatch Task
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Broadcast Panel */}
                <Card className="bg-zinc-900 border-zinc-800 border-t-4 border-t-blue-500 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-blue-400 flex items-center gap-2">
                            <Send className="h-5 w-5" />
                            Global Broadcast
                        </CardTitle>
                        <p className="text-xs text-zinc-500">Send an informational message to all connected peers.</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleBroadcast} className="space-y-4">
                            <input
                                type="text"
                                value={broadcastMsg}
                                onChange={e => setBroadcastMsg(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                placeholder="Message to broadcast..."
                                disabled={!status?.available || broadcastMutation.isPending}
                            />
                            <div className="flex justify-end">
                                <Button 
                                    type="submit" 
                                    disabled={!status?.available || broadcastMutation.isPending || !broadcastMsg.trim()} 
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium"
                                >
                                    {broadcastMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Broadcast
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Peer List */}
            {status?.available && (status.peerIds?.length ?? 0) > 0 && (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Known Peers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {status.peerIds?.map((id: string, index: number) => (
                                <li key={index} className="text-xs text-zinc-500 font-mono bg-zinc-950 p-2 rounded border border-zinc-800/50">
                                    {id}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

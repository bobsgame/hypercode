
'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { Loader2, MessageSquare, Gavel, User, Play, RefreshCw, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import { DebateVisualizer } from "@/components/council/DebateVisualizer";

// Local Interface (mirroring backend slightly for now or just infer from TRPC)
// Ideally we infer from router output, but manual for speed
interface CouncilSession {
    id: string;
    topic: string;
    status: 'active' | 'concluded';
    round: number;
    opinions: any[];
    votes: any[];
    createdAt: number;
}

interface Opinion {
    agentId: string;
    content: string;
    timestamp: number;
    round: number;
}

interface Vote {
    agentId: string;
    choice: string;
    reason: string;
    timestamp: number;
}

export default function CouncilPage() {
    const [sessions, setSessions] = useState<CouncilSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<CouncilSession | null>(null);
    const [newTopic, setNewTopic] = useState("");

    // TRPC Queries
    const listQuery = trpc.council.listSessions.useQuery(undefined, {
        refetchInterval: 5000 // Poll every 5s for live updates
    });
    const runMutation = trpc.council.runSession.useMutation();

    useEffect(() => {
        if (listQuery.data) {
            // @ts-ignore
            setSessions(listQuery.data);
            // Auto-select most recent if none selected
            if (!selectedSession && listQuery.data.length > 0) {
                // @ts-ignore
                setSelectedSession(listQuery.data[0]);
            }
            // Update selected session object from list if it exists (live updates)
            if (selectedSession) {
                // @ts-ignore
                const updated = listQuery.data.find(s => s.id === selectedSession.id);
                if (updated) setSelectedSession(updated);
            }
        }
    }, [listQuery.data]);

    const handleCreateSession = async () => {
        if (!newTopic) return;
        try {
            await runMutation.mutateAsync({ proposal: newTopic });
            setNewTopic("");
            listQuery.refetch();
        } catch (e) {
            console.error("Failed to start session:", e);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-indigo-900/20 rounded-lg flex items-center justify-center border border-indigo-500/30">
                        <Gavel className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            The Council
                        </h1>
                        <p className="text-muted-foreground text-sm">Multi-Agent Consensus & Debate System</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Input
                        placeholder="Propose a topic for debate..."
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        className="w-80 bg-background/50"
                    />
                    <Button onClick={handleCreateSession} className="bg-indigo-600 hover:bg-indigo-700">
                        <Play className="mr-2 h-4 w-4" />
                        Convene Session
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="sessions" className="w-full">
                <TabsList className="bg-background/20 border mb-4">
                    <TabsTrigger value="sessions">Active Debates</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="members">Council Members</TabsTrigger>
                </TabsList>

                <TabsContent value="sessions" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Session List */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active & Recent</h3>
                            {listQuery.isPending ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="text-center p-8 border border-dashed rounded-lg">
                                    <p className="text-muted-foreground">No sessions found.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {sessions.map(session => (
                                        <div
                                            key={session.id}
                                            onClick={() => setSelectedSession(session)}
                                            className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedSession?.id === session.id
                                                ? 'bg-indigo-500/10 border-indigo-500/50'
                                                : 'bg-card hover:bg-accent/50 border-border'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant={session.status === 'active' ? 'default' : 'secondary'} className={session.status === 'active' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : ''}>
                                                    {session.status}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(session.createdAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <h4 className="font-medium text-sm line-clamp-2 mb-2">{session.topic}</h4>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <MessageSquare className="h-3 w-3" />
                                                <span>{session.opinions.length} Opinions</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Visualizer Area */}
                        <div className="lg:col-span-2">
                            {selectedSession ? (
                                <DebateVisualizer
                                    topic={selectedSession.topic}
                                    transcripts={selectedSession.opinions.map(o => ({
                                        speaker: o.agentId, // Assuming agentId is name for now
                                        text: o.content,
                                        round: o.round,
                                        vote: undefined // logic to map votes to opinions is complex, maybe just list votes?
                                    }))}
                                    config={{
                                        rounds: selectedSession.round,
                                        status: selectedSession.status,
                                        result: selectedSession.status === 'concluded' ? "Session Concluded" : undefined
                                    }}
                                />
                            ) : (
                                <div className="h-[600px] border border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                                    Select a session to view details
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>


                <TabsContent value="members">
                    <div className="text-center p-12 text-muted-foreground">
                        Member configuration coming soon.
                    </div>
                </TabsContent>
            </Tabs >
        </div >
    );
}

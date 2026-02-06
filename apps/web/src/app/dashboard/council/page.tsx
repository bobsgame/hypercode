
'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { Loader2, MessageSquare, Gavel, User, Play, RefreshCw, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CouncilSession {
    id: string;
    topic: string;
    status: 'active' | 'concluded';
    round: number;
    opinions: Opinion[];
    votes: Vote[];
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
    const [loading, setLoading] = useState(true);
    const [newTopic, setNewTopic] = useState("");
    const [activeTab, setActiveTab] = useState("sessions");

    // Mock data for now until we have server actions
    useEffect(() => {
        // Simulation of fetching data
        const mockSessions: CouncilSession[] = [

        ];
        setSessions(mockSessions);
        setLoading(false);
    }, []);

    const handleCreateSession = async () => {
        // TODO: Connect to backend
        console.log("Creating session for:", newTopic);
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
                        <div className="lg:col-span-2 space-y-4">
                            {loading ? (
                                <div className="flex justify-center p-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : sessions.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                                        <Gavel className="h-12 w-12 mb-4 opacity-20" />
                                        <h3 className="text-lg font-medium">No Active Debates</h3>
                                        <p className="max-w-sm mt-2">The Council is currently in recess. Propose a topic above to convene a session.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                sessions.map(session => (
                                    <Card key={session.id} className="border-l-4 border-l-indigo-500">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <Badge variant="outline" className="mb-2 border-indigo-500/30 text-indigo-400">
                                                        Round {session.round}
                                                    </Badge>
                                                    <CardTitle className="text-xl">{session.topic}</CardTitle>
                                                </div>
                                                <Badge className={session.status === 'active' ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' : 'bg-gray-800'}>
                                                    {session.status.toUpperCase()}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                                <span className="flex items-center"><MessageSquare className="h-3 w-3 mr-1" /> {session.opinions.length} Opinions</span>
                                                <span className="flex items-center"><User className="h-3 w-3 mr-1" /> {new Set(session.opinions.map(o => o.agentId)).size} Agents</span>
                                            </div>
                                            <Button variant="secondary" size="sm" className="w-full">
                                                View Debate <ChevronRight className="ml-1 h-3 w-3" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Session Stats</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Active Sessions</span>
                                        <span className="font-bold text-xl">{sessions.filter(s => s.status === 'active').length}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Total Opinions</span>
                                        <span className="font-bold text-xl">{sessions.reduce((acc, s) => acc + s.opinions.length, 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Consensus Rate</span>
                                        <span className="font-bold text-xl text-green-400">--%</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Council Manifest</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors">
                                            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                                <User className="h-4 w-4 text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm">The Architect</div>
                                                <div className="text-[10px] text-muted-foreground">System Design</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors">
                                            <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                                                <User className="h-4 w-4 text-red-400" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm">The Critic</div>
                                                <div className="text-[10px] text-muted-foreground">Risk Analysis</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors">
                                            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                                                <User className="h-4 w-4 text-green-400" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm">The Pragmatist</div>
                                                <div className="text-[10px] text-muted-foreground">Implementation</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="members">
                    <div className="text-center p-12 text-muted-foreground">
                        Member configuration coming soon.
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

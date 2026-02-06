
'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Loader2, Search, BookOpen, GitBranch, ExternalLink, Network } from "lucide-react";

interface ResearchNode {
    topic: string;
    summary: string;
    sources: { title: string, url: string }[];
    relatedTopics: string[];
    subTopics?: ResearchNode[];
}

export default function ResearchPage() {
    const [topic, setTopic] = useState("");
    const [depth, setDepth] = useState(2);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ResearchNode | null>(null);

    // Mock initial state or fetch from history later

    const handleResearch = async () => {
        if (!topic) return;
        setLoading(true);
        setResult(null);

        // TODO: Call MCPServer via TRPC or Action
        // Simulating the delay and result for UI dev
        try {
            // In real app, we would use trpc.research.start.mutate({ topic, depth })
            // For now, let's console log
            console.log(`Starting research: ${topic} (Depth: ${depth})`);

            // Wait for "backend"
            // await new Promise(r => setTimeout(r, 3000));

            // Mock Result
            /*
            setResult({
                topic: topic,
                summary: "This is a simulated summary of the deep research.",
                sources: [{ title: "Example Source", url: "https://example.com" }],
                relatedTopics: ["Subtopic 1", "Subtopic 2"],
                subTopics: [
                    {
                        topic: "Subtopic 1",
                        summary: "Summary of subtopic 1...",
                        sources: [],
                        relatedTopics: []
                    }
                ]
            });
            */
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const renderTree = (node: ResearchNode, level: number = 0) => {
        return (
            <div key={node.topic} className={`ml-${level * 4} border-l-2 border-indigo-500/30 pl-4 mb-4`}>
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="border-indigo-500/50 text-indigo-400">
                        {level === 0 ? "ROOT" : `DEPTH ${level}`}
                    </Badge>
                    <h3 className="font-bold text-lg">{node.topic}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed bg-muted/20 p-3 rounded-md">
                    {node.summary}
                </p>

                {node.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {node.sources.slice(0, 3).map((s, i) => (
                            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                                className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 bg-blue-950/30 px-2 py-1 rounded border border-blue-500/20 transition-colors">
                                <ExternalLink className="h-3 w-3" />
                                {s.title || 'Source'}
                            </a>
                        ))}
                    </div>
                )}

                {node.subTopics && node.subTopics.length > 0 && (
                    <div className="mt-4">
                        {node.subTopics.map(sub => renderTree(sub, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
            <div className="flex flex-col gap-4 border-b pb-6">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-cyan-900/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                        <Network className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            Deep Research
                        </h1>
                        <p className="text-muted-foreground">Recursive Knowledge Explorer & Graph Builder</p>
                    </div>
                </div>

                <div className="flex gap-4 items-end bg-muted/20 p-4 rounded-lg border border-border/50">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium">Research Topic</label>
                        <Input
                            placeholder="e.g. Impact of Quantum Computing on Cryptography..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="bg-background"
                        />
                    </div>
                    <div className="w-24 space-y-2">
                        <label className="text-sm font-medium">Depth</label>
                        <Input
                            type="number"
                            min={1}
                            max={5}
                            value={depth}
                            onChange={(e) => setDepth(parseInt(e.target.value))}
                            className="bg-background"
                        />
                    </div>
                    <Button onClick={handleResearch} disabled={loading || !topic} className="bg-cyan-600 hover:bg-cyan-700 w-40">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Start Research
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 min-h-[500px]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-cyan-500" />
                            Research Report
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground animate-pulse">
                                <Search className="h-12 w-12 mb-4 opacity-50" />
                                <p>Exploring deep knowledge tree...</p>
                                <p className="text-xs mt-2">This may take a moment.</p>
                            </div>
                        ) : result ? (
                            <ScrollArea className="h-[600px] pr-4">
                                {renderTree(result)}
                            </ScrollArea>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                                <Network className="h-12 w-12 mb-4 opacity-20" />
                                <p>Enter a topic above to begin a deep dive.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Previous Runs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground text-center py-4">
                                No history available.
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-950/10 border-blue-900/30">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-blue-400">Agent Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>The Explorer</span>
                                <Badge variant="outline" className="text-green-500 border-green-900/50">IDLE</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

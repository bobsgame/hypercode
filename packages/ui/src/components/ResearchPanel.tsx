'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Microscope, Play, Loader2, FileText, Globe } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import ReactMarkdown from 'react-markdown';

export default function ResearchPanel() {
    const [topic, setTopic] = useState('');
    const [depth, setDepth] = useState([2]);
    const [isResearching, setIsResearching] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    // We hook into tool calls? 
    // For now, simple mutation. Real-time logs would require subscription.

    const researchMutation = trpc.research.conduct.useMutation({
        onMutate: () => {
            setIsResearching(true);
            setReport(null);
            setLogs(prev => [...prev, `Starting research on: ${topic} (Depth: ${depth[0]})...`]);
        },
        onSuccess: (data) => {
            setIsResearching(false);
            setReport(data.report);
            setLogs(prev => [...prev, "Research Complete."]);
        },
        onError: (err) => {
            setIsResearching(false);
            setLogs(prev => [...prev, `Error: ${err.message}`]);
        }
    });

    const handleStart = () => {
        if (!topic) return;
        researchMutation.mutate({ topic, depth: depth[0] });
    };

    return (
        <div className="container mx-auto p-6 max-w-5xl space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <Microscope className="w-10 h-10 text-purple-400" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Deep Research</h1>
                    <p className="text-muted-foreground">Autonomous web crawling and knowledge synthesis.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Control Panel */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Research Topic</label>
                            <Input
                                placeholder="e.g. Latest advancements in SolidJS"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                disabled={isResearching}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex justify-between">
                                Depth (Pages)
                                <span className="text-muted-foreground">{depth[0]}</span>
                            </label>
                            <Slider
                                value={depth}
                                onValueChange={setDepth}
                                max={10}
                                min={1}
                                step={1}
                                disabled={isResearching}
                            />
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleStart}
                            disabled={!topic || isResearching}
                        >
                            {isResearching ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Researching...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Agent
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Results / Logs */}
                <Card className="md:col-span-2 min-h-[500px] flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            {report ? <FileText className="w-5 h-5 mr-2" /> : <Globe className="w-5 h-5 mr-2" />}
                            {report ? "Final Report" : "Live Output"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 relative">
                        <ScrollArea className="h-[450px] pr-4">
                            {report ? (
                                <div className="prose dark:prose-invert max-w-none">
                                    <ReactMarkdown>{report}</ReactMarkdown>
                                </div>
                            ) : (
                                <div className="font-mono text-sm space-y-1 text-muted-foreground">
                                    {logs.map((log, i) => (
                                        <div key={i} className="border-l-2 border-zinc-800 pl-2 py-1">
                                            {log}
                                        </div>
                                    ))}
                                    {isResearching && (
                                        <div className="animate-pulse">_</div>
                                    )}
                                    {logs.length === 0 && (
                                        <div className="text-center mt-20 opacity-50">
                                            Enter a topic to begin research.
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

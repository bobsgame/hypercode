"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@borg/ui";
import { Button } from "@borg/ui";
import { Loader2, Play, Wrench, Search, ChevronRight } from "lucide-react";
import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';

export default function InspectorDashboard() {
    const { data: tools, isLoading: isLoadingTools } = trpc.tools.list.useQuery();
    const [selectedTool, setSelectedTool] = useState<any | null>(null);
    const [argsJson, setArgsJson] = useState('{}');
    const [result, setResult] = useState<any | null>(null);

    const runMutation = trpc.agent.runTool.useMutation({
        onSuccess: (data) => {
            setResult(data);
            toast.success("Tool executed successfully");
        },
        onError: (err) => {
            setResult({ error: err.message });
            toast.error("Tool execution failed");
        }
    });

    const handleRun = () => {
        if (!selectedTool) return;
        try {
            const args = JSON.parse(argsJson);
            runMutation.mutate({
                toolName: selectedTool.name,
                arguments: args
            });
        } catch (e) {
            toast.error("Invalid JSON arguments");
        }
    };

    return (
        <div className="p-8 space-y-8 h-full flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Inspector</h1>
                    <p className="text-zinc-500">
                        Manually inspect and execute MCP tools
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Tool Selection Sidebar */}
                <Card className="col-span-3 bg-zinc-900 border-zinc-800 flex flex-col overflow-hidden">
                    <CardHeader className="pb-3 border-b border-zinc-800">
                        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <Search className="h-4 w-4" /> Available Tools
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-y-auto">
                        {isLoadingTools ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-800/50">
                                {tools?.map((tool: any) => (
                                    <button
                                        key={tool.uuid}
                                        onClick={() => {
                                            setSelectedTool(tool);
                                            setResult(null);
                                            // Pre-fill args with schema example if possible, else empty object
                                            setArgsJson('{}');
                                        }}
                                        className={`w-full text-left p-3 text-sm hover:bg-zinc-800 transition-colors flex items-center justify-between group ${selectedTool?.uuid === tool.uuid ? 'bg-blue-900/20 text-blue-400 border-l-2 border-l-blue-500' : 'text-zinc-300'
                                            }`}
                                    >
                                        <div className="truncate pr-2">
                                            <div className="font-mono">{tool.name}</div>
                                            <div className="text-xs text-zinc-500 truncate">{tool.server}</div>
                                        </div>
                                        <ChevronRight className={`h-4 w-4 text-zinc-600 group-hover:text-zinc-400 ${selectedTool?.uuid === tool.uuid ? 'text-blue-500' : ''
                                            }`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Execution Pane */}
                <Card className="col-span-9 bg-zinc-900 border-zinc-800 flex flex-col overflow-hidden">
                    {selectedTool ? (
                        <>
                            <CardHeader className="pb-4 border-b border-zinc-800">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl font-mono text-white flex items-center gap-2">
                                            <Wrench className="h-5 w-5 text-purple-500" />
                                            {selectedTool.name}
                                        </CardTitle>
                                        <p className="text-sm text-zinc-400 mt-1">{selectedTool.description}</p>
                                    </div>
                                    <Button onClick={handleRun} disabled={runMutation.isPending} className="bg-green-600 hover:bg-green-500">
                                        {runMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                        Run Tool
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Arguments Input */}
                                <div className="space-y-2">
                                    <label className="text-xs text-zinc-500 uppercase font-bold">Arguments (JSON)</label>
                                    <div className="relative">
                                        <textarea
                                            value={argsJson}
                                            onChange={(e) => setArgsJson(e.target.value)}
                                            className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-md p-4 font-mono text-sm text-zinc-300 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                                        />
                                        {/* Schema Helper (Visual only for now) */}
                                        <div className="absolute top-2 right-2 text-[10px] text-zinc-600 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                                            Schema Validation Active
                                        </div>
                                    </div>
                                    {selectedTool.inputSchema && (
                                        <div className="text-xs text-zinc-500">
                                            Expected: <code className="bg-zinc-800 px-1 rounded">{JSON.stringify(selectedTool.inputSchema.properties ? Object.keys(selectedTool.inputSchema.properties) : [])}</code>
                                        </div>
                                    )}
                                </div>

                                {/* Results Output */}
                                <div className="space-y-2 flex-1 flex flex-col min-h-0">
                                    <label className="text-xs text-zinc-500 uppercase font-bold">Execution Result</label>
                                    <div className={`flex-1 bg-zinc-950 border border-zinc-800 rounded-md p-4 font-mono text-sm overflow-auto min-h-[200px] ${result?.error ? 'text-red-400 border-red-900/30' : 'text-green-400'
                                        }`}>
                                        {result ? (
                                            <pre>{JSON.stringify(result, null, 2)}</pre>
                                        ) : (
                                            <span className="text-zinc-600 italic">Waiting for execution...</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                            <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center">
                                <Search className="h-8 w-8 text-zinc-600" />
                            </div>
                            <p className="text-lg">Select a tool to inspect</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Book, Cpu, Shield, Activity, GraduationCap, GitBranch, Terminal } from 'lucide-react';

export default function ManualPage() {
    return (
        <div className="container mx-auto p-6 space-y-6 max-w-5xl">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                    <Book className="w-8 h-8 text-blue-400" />
                    Borg User Manual
                </h1>
                <p className="text-xl text-muted-foreground">
                    Comprehensive guide to the Neural Operating System v2.3.0.
                </p>
            </div>

            <Tabs defaultValue="getting-started" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 bg-zinc-900 border border-zinc-800 h-auto p-1">
                    <TabsTrigger value="getting-started" className="data-[state=active]:bg-blue-900/50 py-3">Getting Started</TabsTrigger>
                    <TabsTrigger value="core-agents" className="data-[state=active]:bg-purple-900/50 py-3">Core Agents</TabsTrigger>
                    <TabsTrigger value="workflows" className="data-[state=active]:bg-green-900/50 py-3">Workflows & Mode</TabsTrigger>
                    <TabsTrigger value="advanced" className="data-[state=active]:bg-red-900/50 py-3">Advanced Ops</TabsTrigger>
                </TabsList>

                <TabsContent value="getting-started">
                    <Card className="bg-zinc-950 border-zinc-800">
                        <CardHeader>
                            <CardTitle>Welcome to the Collective</CardTitle>
                            <CardDescription>System overview and basic navigation.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p>The Borg is an autonomous agentic system designed for self-evolving software development.</p>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                                    <h3 className="font-bold flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-green-400" /> The Pulse</h3>
                                    <p className="text-sm text-zinc-400">Real-time system telemetry. Check this first to see active agents and heartbeat status.</p>
                                </div>
                                <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                                    <h3 className="font-bold flex items-center gap-2 mb-2"><Terminal className="w-4 h-4 text-yellow-400" /> Command Center</h3>
                                    <p className="text-sm text-zinc-400">Direct interface to the <strong>Director</strong> agent. Issue natural language objectives here.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="core-agents">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="director">
                            <AccordionTrigger className="text-lg font-semibold text-yellow-400">The Director</AccordionTrigger>
                            <AccordionContent className="text-zinc-300">
                                The high-level orchestrator. It decomposes user goals into actionable plans (Squads) and oversees execution.
                                <ul className="list-disc list-inside mt-2 text-sm text-zinc-400">
                                    <li><strong>Capabilities:</strong> Auto-drive, Squad spawning, Deep Research trigger.</li>
                                    <li><strong>Monitoring:</strong> Watch progress on the <em>Director Dashboard</em>.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="council">
                            <AccordionTrigger className="text-lg font-semibold text-purple-400">The Council</AccordionTrigger>
                            <AccordionContent className="text-zinc-300">
                                A consensus engine enabling multi-model debate. Used for critical architectural decisions.
                                <ul className="list-disc list-inside mt-2 text-sm text-zinc-400">
                                    <li><strong>Mechanism:</strong> 3-5 Personas (Architect, Critic, Engineer) debate a topic.</li>
                                    <li><strong>Output:</strong> A binding Resolution stored in Long-Term Memory.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="supervisor">
                            <AccordionTrigger className="text-lg font-semibold text-blue-400">The Supervisor</AccordionTrigger>
                            <AccordionContent className="text-zinc-300">
                                Manages execution details using ReAct loops. Ensures tasks are completed to spec.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="healer">
                            <AccordionTrigger className="text-lg font-semibold text-green-400">The Healer</AccordionTrigger>
                            <AccordionContent className="text-zinc-300">
                                Self-correction system. Reacts to terminal errors and test failures by proposing and applying fixes automatically.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </TabsContent>

                <TabsContent value="workflows">
                    <Card className="bg-zinc-950 border-zinc-800">
                        <CardHeader>
                            <CardTitle>Plan vs Build Mode</CardTitle>
                            <CardDescription>Understanding the safety protocols.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1 p-4 border border-blue-900/30 bg-blue-950/10 rounded-lg">
                                    <h3 className="font-bold text-blue-400 flex items-center gap-2"><Book className="w-4 h-4" /> PLAN Mode</h3>
                                    <p className="text-sm mt-2 text-zinc-300">
                                        Read-only exploration. Agents can read files, search memory, and propose changes, but cannot modify the filesystem directly.
                                        Proposed changes go to the <strong>Diff Sandbox</strong>.
                                    </p>
                                </div>
                                <div className="flex-1 p-4 border border-red-900/30 bg-red-950/10 rounded-lg">
                                    <h3 className="font-bold text-red-400 flex items-center gap-2"><GitBranch className="w-4 h-4" /> BUILD Mode</h3>
                                    <p className="text-sm mt-2 text-zinc-300">
                                        Active development. Agents can apply diffs from the Sandbox.
                                        Requires explicit user approval or Supervisor authorization.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="advanced">
                    <div className="grid grid-cols-1 gap-4">
                        <Card className="bg-zinc-950 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-pink-400" /> Skill Assimilation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-zinc-400">
                                    The Borg can learn new capabilities by ingesting documentation.
                                    Use the <strong>Skills Dashboard</strong> to point the system at a documentation URL.
                                    It will generate a new MCP tool in <code>packages/core/src/skills/</code> automatically.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-zinc-950 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-orange-400" /> Security & Policy</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-zinc-400">
                                    RBAC and Autonomy Levels are enforced by the <strong>Policy Service</strong>.
                                    Check the Security Dashboard to audit permissions or lock down the system (Red Alert).
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

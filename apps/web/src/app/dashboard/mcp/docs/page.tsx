"use client";

import { Card, CardContent } from "@borg/ui";
import { BookOpen, FileText, Code, GitBranch } from "lucide-react";

export default function DocsDashboard() {
    return (
        <div className="p-8 space-y-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Documentation</h1>
                    <p className="text-zinc-500">
                        Guides and references for MetaMCP
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Navigation Sidebar (Mock) */}
                <div className="space-y-2">
                    <div className="font-semibold text-white px-3 py-2">Getting Started</div>
                    <NavKey title="Introduction" active />
                    <NavKey title="Installation" />
                    <NavKey title="Quick Start" />

                    <div className="font-semibold text-white px-3 py-2 mt-6">Core Concepts</div>
                    <NavKey title="Aggregator" />
                    <NavKey title="Routing" />
                    <NavKey title="Security" />

                    <div className="font-semibold text-white px-3 py-2 mt-6">API Reference</div>
                    <NavKey title="TRPC Endpoints" />
                    <NavKey title="MCP Primitives" />
                </div>

                {/* Content Area */}
                <div className="col-span-2 space-y-8 max-w-4xl">
                    <Section title="Introduction to MetaMCP">
                        <p>
                            MetaMCP is a Model Context Protocol aggregator that sits between LLMs and downstream MCP servers.
                            It provides a unified interface for tool discovery, execution, and management, effectively turning
                            multiple disparate agents into a cohesive nervous system for Borg.
                        </p>
                    </Section>

                    <Section title="Architecture">
                        <p>
                            The system is built on a hub-and-spoke model. The central Aggregator maintains persistent connections
                            to downstream servers via STDIO or SSE. It creates a unified tool catalog and routes requests based
                            in namespace or capability.
                        </p>
                        <div className="bg-black/50 p-4 rounded border border-zinc-800 my-4 font-mono text-xs">
                            LLM --{'>'} [ MetaMCP Proxy ] --{'>'} [ Server A, Server B, Server ... ]
                        </div>
                    </Section>

                    <Section title="Key Features">
                        <ul className="list-disc list-inside space-y-2 ml-2">
                            <li><strong>Progressive Disclosure:</strong> Filters tools to reduce context window usage.</li>
                            <li><strong>Unified Identity:</strong> Manages auth/policies centrally.</li>
                            <li><strong>Resiliency:</strong> Auto-reconnects to dropped servers.</li>
                            <li><strong>Observability:</strong> Logs all input/output for audit trails.</li>
                        </ul>
                    </Section>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-500" />
                {title}
            </h2>
            <div className="text-zinc-300 leading-relaxed space-y-4">
                {children}
            </div>
        </section>
    );
}

function NavKey({ title, active }: { title: string; active?: boolean }) {
    return (
        <div className={`px-3 py-2 rounded text-sm cursor-pointer transition-colors ${active ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}>
            {title}
        </div>
    );
}

'use client';

import React from 'react';
import Link from 'next/link';
import {
    Activity, Brain, Shield, Zap, Terminal, Code, BookOpen,
    Settings, Cpu, Users, GitBranch, Layers, Eye, FileText,
    Hammer, BarChart3, Workflow, Heart, Package, Search
} from 'lucide-react';

const sections = [
    {
        title: 'Command & Control',
        items: [
            { name: 'Director', href: '/dashboard/director', icon: Cpu, color: 'text-blue-400', desc: 'Agent orchestration' },
            { name: 'Council', href: '/dashboard/council', icon: Users, color: 'text-indigo-400', desc: 'Multi-agent consensus' },
            { name: 'Supervisor', href: '/dashboard/supervisor', icon: Eye, color: 'text-yellow-400', desc: 'Process oversight' },
            { name: 'Squads', href: '/dashboard/squads', icon: Layers, color: 'text-cyan-400', desc: 'Team coordination' },
        ]
    },
    {
        title: 'Intelligence',
        items: [
            { name: 'Memory', href: '/dashboard/memory', icon: Brain, color: 'text-purple-400', desc: 'Knowledge store' },
            { name: 'Research', href: '/dashboard/research', icon: Search, color: 'text-green-400', desc: 'Deep research' },
            { name: 'Skills', href: '/dashboard/skills', icon: Hammer, color: 'text-orange-400', desc: 'Skill acquisition' },
            { name: 'Knowledge', href: '/dashboard/knowledge', icon: BookOpen, color: 'text-teal-400', desc: 'Knowledge graph' },
        ]
    },
    {
        title: 'System',
        items: [
            { name: 'Events', href: '/dashboard/events', icon: Zap, color: 'text-purple-400', desc: 'Nervous system' },
            { name: 'MCP', href: '/dashboard/mcp', icon: Package, color: 'text-blue-400', desc: 'Tool aggregator' },
            { name: 'Healer', href: '/dashboard/healer', icon: Heart, color: 'text-red-400', desc: 'Self-correction' },
            { name: 'Security', href: '/dashboard/security', icon: Shield, color: 'text-green-400', desc: 'Threat monitoring' },
        ]
    },
    {
        title: 'Development',
        items: [
            { name: 'Workflows', href: '/dashboard/workflows', icon: Workflow, color: 'text-cyan-400', desc: 'Task pipelines' },
            { name: 'Code', href: '/dashboard/code', icon: Code, color: 'text-yellow-400', desc: 'Code operations' },
            { name: 'Submodules', href: '/dashboard/submodules', icon: GitBranch, color: 'text-orange-400', desc: 'Module manager' },
            { name: 'Metrics', href: '/dashboard/metrics', icon: BarChart3, color: 'text-pink-400', desc: 'System analytics' },
        ]
    },
    {
        title: 'Tools',
        items: [
            { name: 'Command', href: '/dashboard/command', icon: Terminal, color: 'text-green-400', desc: 'Terminal access' },
            { name: 'Inspector', href: '/dashboard/inspector', icon: Eye, color: 'text-blue-400', desc: 'State inspector' },
            { name: 'Chronicle', href: '/dashboard/chronicle', icon: FileText, color: 'text-zinc-400', desc: 'Session logs' },
            { name: 'Settings', href: '/dashboard/settings', icon: Settings, color: 'text-zinc-400', desc: 'Configuration' },
        ]
    },
];

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-6 py-10 max-w-6xl">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            Borg Dashboard
                        </h1>
                    </div>
                    <p className="text-zinc-500 ml-[52px]">Neural Operating System — Mission Control</p>
                </div>

                {/* Sections */}
                <div className="space-y-8">
                    {sections.map((section) => (
                        <div key={section.title}>
                            <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-500 mb-3 ml-1">
                                {section.title}
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {section.items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className="group flex flex-col gap-2 p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className={`h-5 w-5 ${item.color} group-hover:scale-110 transition-transform`} />
                                                <span className="font-medium text-sm text-zinc-200 group-hover:text-white transition-colors">
                                                    {item.name}
                                                </span>
                                            </div>
                                            <span className="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">
                                                {item.desc}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-10 pt-6 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-600">
                    <Link href="/" className="hover:text-zinc-400 transition-colors">
                        ← Back to Mission Control
                    </Link>
                    <span>Borg v2.6.2</span>
                </div>
            </div>
        </div>
    );
}

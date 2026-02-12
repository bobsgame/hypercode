"use client";

import { useEffect, useRef, useState } from 'react';

// Logs router is currently disabled — using static placeholder
export function TraceViewer() {
    const [enabled, setEnabled] = useState(true);
    const [autoScroll, setAutoScroll] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    return (
        <div className="p-6 bg-[#1e1e1e] rounded-xl border border-[#333] shadow-lg flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">Supervisor Trace</h2>
                    <p className="text-gray-400 text-sm">Live loop activity and autonomous decisions</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setAutoScroll(!autoScroll)}
                        className={`px-3 py-1 text-sm rounded transition-colors ${autoScroll
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                            : 'bg-[#333] text-gray-400 border border-[#444] hover:bg-[#444]'
                            }`}
                    >
                        {autoScroll ? '⬇ Locked' : '✋ Manual'}
                    </button>
                    <button
                        onClick={() => setEnabled(!enabled)}
                        className={`px-3 py-1 text-sm rounded transition-colors ${enabled
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                            }`}
                    >
                        {enabled ? '● Live' : '○ Paused'}
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-[#111] rounded p-4 overflow-y-auto font-mono text-sm text-gray-300 whitespace-pre-wrap">
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <p className="text-lg font-medium">Logs Router Not Active</p>
                    <p className="text-sm mt-1">Enable the logs router in trpc.ts for live traces.</p>
                </div>
                <div ref={bottomRef} />
            </div>
        </div>
    );
}

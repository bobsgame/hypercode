"use client";
import React from 'react';

// AutoTest router is currently disabled — using static placeholder
export function TestStatusWidget() {
    return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-4 h-full flex flex-col">
            <div className="absolute inset-0 opacity-10 blur-3xl bg-green-500" />
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="text-2xl">🧪</span>
                        Auto-Test Watcher
                    </h3>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
                        <div className="text-xl font-bold text-green-400">—</div>
                        <div className="text-[10px] text-green-300/70 uppercase">Passed</div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
                        <div className="text-xl font-bold text-red-400">—</div>
                        <div className="text-[10px] text-red-300/70 uppercase">Failed</div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 text-center">
                        <div className="text-xl font-bold text-blue-400">—</div>
                        <div className="text-[10px] text-blue-300/70 uppercase">Running</div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
                    <span className="text-4xl mb-2">🧪</span>
                    <p className="text-sm">AutoTest Router Not Active</p>
                    <p className="text-[10px]">Enable the autoTest router in trpc.ts</p>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between items-center">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-500">
                        ○ STOPPED
                    </span>
                    <span className="text-[10px] text-zinc-600">0 test results</span>
                </div>
            </div>
        </div>
    );
}

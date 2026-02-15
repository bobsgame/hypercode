"use client";

import React, { useState, useEffect } from "react";

export default function MemoryDashboardPage() {
    const [loading, setLoading] = useState(true);
    const memoryUrl = "http://localhost:37777";

    useEffect(() => {
        // Simple check to see if the service is up (optional, might block if CORS)
        // For now, we assume it's running.
        setLoading(false);
    }, []);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
                <div>
                    <h1 className="text-xl font-bold text-white">Claude Memory</h1>
                    <p className="text-gray-400 text-sm">Semantic Memory & Knowledge Graph</p>
                </div>
                <div className="flex gap-2">
                    <a
                        href={memoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                    >
                        Open Standalone
                    </a>
                </div>
            </div>
            <div className="flex-1 relative bg-black">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        Connecting to Memory Service...
                    </div>
                ) : (
                    <iframe
                        src={memoryUrl}
                        className="w-full h-full border-none"
                        title="Claude Memory Dashboard"
                        allow="clipboard-read; clipboard-write"
                    />
                )}
            </div>
        </div>
    );
}

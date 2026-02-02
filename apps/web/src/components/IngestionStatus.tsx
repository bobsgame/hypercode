
import React, { useEffect, useState } from 'react';

interface Stats {
    brain: {
        totalMemories: number;
        status: string;
    };
    ingestion: {
        lastBatch: string;
        status: string;
    };
}

export default function IngestionStatus() {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/monitoring/stats');
                if (res.ok) {
                    setStats(await res.json());
                }
            } catch (e) {
                console.error("Failed to fetch stats", e);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!stats) return <div className="text-gray-500 text-sm p-4">Loading stats...</div>;

    return (
        <div className="grid grid-cols-2 gap-2 h-full">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex flex-col justify-center items-center">
                <div className="text-2xl font-bold text-blue-400">{stats.brain.totalMemories}</div>
                <div className="text-xs text-blue-200/70 uppercase tracking-widest mt-1">Memories</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 flex flex-col justify-center items-center">
                <div className="text-lg font-bold text-purple-400">{stats.ingestion.status}</div>
                <div className="text-xs text-purple-200/70 uppercase tracking-widest mt-1">Batch 4</div>
            </div>
        </div>
    );
}

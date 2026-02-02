
import React, { useEffect, useState } from 'react';

interface HealerEvent {
    type: string;
    file: string;
    timestamp: string;
    details?: string;
    error?: string;
}

export function HealerWidget() {
    const [events, setEvents] = useState<HealerEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('/api/monitoring/events');
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data.events || []);
                }
            } catch (e) {
                console.error("Failed to fetch healer events", e);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
        const interval = setInterval(fetchEvents, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading && events.length === 0) return <div className="text-sm text-gray-500 p-4">Loading Healer History...</div>;

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                <div className="text-2xl mb-2">🩺</div>
                <p>No recent healing events.</p>
                <p className="text-xs opacity-50">System is healthy.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-auto p-2 space-y-2">
            {events.map((event, i) => (
                <div key={i} className={`p-2 rounded border ${event.type === 'FIX_FAILED' ? 'border-red-500/20 bg-red-500/5' : 'border-green-500/20 bg-green-500/5'}`}>
                    <div className="flex justify-between items-start">
                        <span className="font-mono text-xs font-bold uppercase opacity-75">
                            {event.type === 'FIX_APPLIED' ? '🩹 Fixed' : (event.type === 'FIX_FAILED' ? '❌ Failed' : event.type)}
                        </span>
                        <span className="text-[10px] opacity-50">
                            {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                    <div className="text-sm font-mono mt-1 break-all text-blue-300">
                        {event.file}
                    </div>
                    {event.details && <div className="text-xs mt-1 text-gray-400">{event.details}</div>}
                    {event.error && <div className="text-xs mt-1 text-red-400">{event.error}</div>}
                </div>
            ))}
        </div>
    );
}

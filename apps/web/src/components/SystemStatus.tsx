'use client';

// System router is currently disabled — using static placeholder data
export default function SystemStatus() {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                System Status
            </h2>
            <div className="grid grid-cols-2 gap-4">
                <Stat label="CPU Load (1m)" value="—" unit="" />
                <Stat label="Memory Usage" value="—" unit="%" />
                <Stat label="Free RAM" value="—" unit="GB" />
                <Stat label="Uptime" value="—" unit="h" />
            </div>
            <div className="text-xs text-gray-600 font-mono mt-2">
                System router not active. Enable in trpc.ts for live stats.
            </div>
        </div>
    );
}

function Stat({ label, value, unit }: any) {
    return (
        <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-800/50">
            <div className="text-gray-400 text-xs font-medium uppercase tracking-wider">{label}</div>
            <div className="text-emerald-300 font-mono text-xl font-bold mt-1">
                {value}<span className="text-xs text-gray-500 ml-1 font-normal">{unit}</span>
            </div>
        </div>
    )
}

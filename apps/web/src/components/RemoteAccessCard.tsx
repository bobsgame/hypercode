"use client";
import { useState } from "react";

// RemoteAccess router is currently disabled — using static placeholder
export default function RemoteAccessCard() {
    const isActive = false;
    const isLoading = false;
    const [error] = useState<string | null>(null);

    return (
        <div className="p-6 border rounded-lg bg-zinc-900 text-zinc-100 shadow-md w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">📡 Remote Access</h2>
                <div className={`px-2 py-1 rounded text-xs font-bold bg-zinc-700`}>
                    OFFLINE
                </div>
            </div>

            <p className="text-sm text-zinc-400 mb-4">
                Expose your Borg Dashboard securely via Cloudflare Tunnel to access it from your mobile device.
            </p>

            {error && (
                <div className="mb-4 p-2 bg-red-900/50 text-red-200 text-sm rounded">
                    {error}
                </div>
            )}

            <button
                disabled={true}
                title="RemoteAccess router not active"
                className="w-full py-2 px-4 rounded font-medium bg-blue-600 text-white opacity-50 cursor-not-allowed"
            >
                Enable Remote Access (Router Disabled)
            </button>
        </div>
    );
}

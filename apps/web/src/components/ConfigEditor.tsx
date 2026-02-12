"use client";
import { useState, useEffect } from "react";

// Config router is currently disabled — using static placeholder
export default function ConfigEditor() {
    const [jsonContent, setJsonContent] = useState<string>("{}");
    const [status, setStatus] = useState<string>("");
    const isLoading = false;

    const handleSave = async () => {
        setStatus("Config router is not active. Enable it in trpc.ts to save configuration.");
    };

    return (
        <div className="p-6 border rounded-lg bg-zinc-900 text-zinc-100 shadow-md w-full max-w-2xl mt-8">
            <h2 className="text-xl font-bold mb-4">⚙️ Antigravity Config (mcp.json)</h2>
            <div className="relative">
                <textarea
                    className="w-full h-96 bg-black font-mono text-sm p-4 border border-zinc-700 rounded focus:border-blue-500 outline-none"
                    value={jsonContent}
                    onChange={(e) => setJsonContent(e.target.value)}
                />
            </div>
            <div className="flex justify-between items-center mt-4">
                <span className={`text-sm ${status.includes("not active") ? "text-yellow-400" : status.includes("Error") ? "text-red-400" : "text-green-400"}`}>
                    {status}
                </span>
                <button
                    onClick={handleSave}
                    disabled={true}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded font-medium disabled:opacity-50"
                >
                    Save Config (Router Disabled)
                </button>
            </div>
        </div>
    );
}

"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Search and vscode routers are currently disabled — using local no-op implementations
export const GlobalSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setIsOpen(true);
        // Search router disabled — show placeholder
        setResults([{ file: 'Search unavailable', snippet: 'Enable the search router in trpc.ts for codebase search.' }]);
    };

    const handleOpenFile = (path: string) => {
        // vscode router disabled — no-op
        console.log('vscode.open disabled:', path);
        setIsOpen(false);
        setQuery('');
    };

    return (
        <div className="relative z-50">
            <form onSubmit={handleSearch} className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search codebase..."
                    className="w-64 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-4 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:w-96 transition-all"
                />
                <button type="submit" className="absolute right-3 top-1.5 text-zinc-400 hover:text-blue-500">
                    🔍
                </button>
            </form>

            <AnimatePresence>
                {isOpen && (results.length > 0 || isSearching) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-0 top-12 w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl overflow-hidden"
                    >
                        {isSearching ? (
                            <div className="p-4 text-center text-zinc-500 text-sm">Searching vector index...</div>
                        ) : (
                            <div className="max-h-96 overflow-y-auto">
                                {results.map((res, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleOpenFile(res.file)}
                                        className="w-full text-left p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 last:border-0 transition-colors"
                                    >
                                        <div className="text-xs font-bold text-blue-500 break-all">{res.file}</div>
                                        <div className="text-xs text-zinc-500 mt-1 line-clamp-2 font-mono bg-zinc-50 dark:bg-black p-1 rounded">
                                            {res.snippet}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="bg-zinc-50 dark:bg-black p-2 text-[10px] text-center text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
                            Press ESC to close
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isOpen && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

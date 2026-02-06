'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { fetchSubmodulesAction, healSubmodulesAction } from "./actions";
import { SubmoduleInfo } from "@/lib/git";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

export default function SubmodulesPage() {
    const [submodules, setSubmodules] = useState<SubmoduleInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubmodulesAction().then(data => {
            setSubmodules(data);
            setLoading(false);
        });
    }, []);

    const cleanCount = submodules.filter(s => s.status === 'clean').length;
    const dirtyCount = submodules.filter(s => s.status === 'dirty').length;
    const missingCount = submodules.filter(s => s.status === 'missing').length;
    const errorCount = submodules.filter(s => s.status === 'error').length;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Modules</h1>
                    <p className="text-muted-foreground mt-1">Manage git submodules and view project hierarchy.</p>
                </div>
                <HealButton />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatusCard title="Clean" value={cleanCount} color="text-green-500" />
                <StatusCard title="Dirty" value={dirtyCount} color="text-yellow-500" />
                <StatusCard title="Missing" value={missingCount} color="text-red-500" />
                <StatusCard title="Errors" value={errorCount} color="text-gray-500" />
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Repository Map ({submodules.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <p className="text-muted-foreground animate-pulse p-4">Scanning repository... (analyzing git status)</p>
                            ) : (
                                <div className="rounded-md border overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                                            <tr>
                                                <th className="p-4">Module Name</th>
                                                <th className="p-4">Location (Root Relative)</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4">Version (Commit)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {submodules.map((sub) => (
                                                <tr key={sub.path} className="hover:bg-muted/20 transition-colors">
                                                    <td className="p-4 font-semibold">{sub.path.split('/').pop()}</td>
                                                    <td className="p-4 font-mono text-muted-foreground">{sub.path}</td>
                                                    <td className="p-4">
                                                        <StatusBadge status={sub.status} />
                                                    </td>
                                                    <td className="p-4 font-mono text-xs">
                                                        <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                                                            {sub.lastCommit ? sub.lastCommit.substring(0, 7) : 'HEAD'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Structure</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm text-muted-foreground space-y-1 font-mono">
                                <div className="flex items-center gap-2"><span className="text-blue-500">📂</span> <span>apps/</span></div>
                                <div className="pl-6 border-l ml-2 border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center gap-2"><span>📦</span> <span>web</span> <span className="text-xs text-zinc-500">(Next.js Dashboard)</span></div>
                                    <div className="flex items-center gap-2"><span>📦</span> <span>extension</span> <span className="text-xs text-zinc-500">(Browser Agent)</span></div>
                                    <div className="flex items-center gap-2"><span>📦</span> <span>vscode</span> <span className="text-xs text-zinc-500">(Extension)</span></div>
                                </div>
                                <div className="flex items-center gap-2 mt-2"><span className="text-blue-500">📂</span> <span>packages/</span></div>
                                <div className="pl-6 border-l ml-2 border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center gap-2"><span>lib</span> <span>core</span> <span className="text-xs text-zinc-500">(Borg Engine)</span></div>
                                    <div className="flex items-center gap-2"><span>lib</span> <span>ui</span> <span className="text-xs text-zinc-500">(Shared Components)</span></div>
                                    <div className="flex items-center gap-2"><span>lib</span> <span>memory</span> <span className="text-xs text-zinc-500">(Vector DB)</span></div>
                                </div>
                                <div className="flex items-center gap-2 mt-2"><span className="text-blue-500">📂</span> <span>docs/</span></div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-4">
                                This monorepo uses <strong>TurboRepo</strong> for build orchestration.
                                Core logic resides in <code>packages/core</code>, while interfaces live in <code>apps/</code>.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function StatusCard({ title, value, color }: { title: string, value: number, color: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </CardContent>
        </Card>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        clean: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        dirty: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        missing: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        error: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || styles.error}`}>
            {status.toUpperCase()}
        </span>
    );
}

function HealButton() {
    const [healing, setHealing] = useState(false);

    const handleHeal = async () => {
        setHealing(true);
        try {
            const res = await healSubmodulesAction();
            if (res.success) {
                alert("Submodules Healed! Refreshing page...");
                window.location.reload();
            } else {
                alert("Heal Failed: " + res.message);
            }
        } catch (e) {
            alert("Error: " + e);
        } finally {
            setHealing(false);
        }
    };

    return (
        <Button onClick={handleHeal} disabled={healing} variant="default">
            {healing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {healing ? "Healing..." : "Heal Submodules"}
        </Button>
    );
}


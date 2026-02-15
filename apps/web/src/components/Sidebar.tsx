"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@borg/ui"; // Assuming shadcn-like export
import { META_MCP_NAV } from "./mcp/nav-config";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    return (
        <div className={cn("pb-12 w-64 border-r border-zinc-800 bg-zinc-950 hidden md:block", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-white">
                        MetaMCP
                    </h2>
                    <div className="space-y-1">
                        {META_MCP_NAV.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-zinc-800 hover:text-white transition-colors",
                                    pathname === item.href ? "bg-zinc-800 text-white" : "text-zinc-400",
                                    "justify-start"
                                )}
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.title}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

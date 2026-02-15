import {
    Server,
    Box,
    Globe,
    Key,
    Layers,
    Shield,
    FileCode,
    FileText,
    Settings,
    Search,
    BookOpen,
    Activity,
    Zap,
    Bot,
    Wrench,
    Download,
} from "lucide-react";

export interface NavItem {
    title: string;
    href: string;
    icon: any;
    variant: "default" | "ghost";
}

export const META_MCP_NAV: NavItem[] = [
    {
        title: "Mission Control",
        href: "/dashboard/mcp",
        icon: Server,
        variant: "default",
    },
    {
        title: "Namespaces",
        href: "/dashboard/mcp/namespaces",
        icon: Box,
        variant: "ghost",
    },
    {
        title: "Endpoints",
        href: "/dashboard/mcp/endpoints",
        icon: Globe,
        variant: "ghost",
    },
    {
        title: "API Keys",
        href: "/dashboard/mcp/api-keys",
        icon: Key,
        variant: "ghost",
    },
    {
        title: "Tool Sets",
        href: "/dashboard/mcp/tool-sets",
        icon: Layers,
        variant: "ghost",
    },
    {
        title: "Policies",
        href: "/dashboard/mcp/policies",
        icon: Shield,
        variant: "ghost",
    },
    {
        title: "Internal Scripts",
        href: "/dashboard/mcp/scripts",
        icon: FileCode,
        variant: "ghost",
    },
    {
        title: "System Audit",
        href: "/dashboard/mcp/audit",
        icon: FileText,
        variant: "ghost",
    },
    {
        title: "Logs",
        href: "/dashboard/mcp/logs",
        icon: Activity,
        variant: "ghost",
    },
    {
        title: "Observability",
        href: "/dashboard/mcp/observability",
        icon: Zap,
        variant: "ghost",
    },
    {
        title: "Inspector",
        href: "/dashboard/mcp/inspector",
        icon: Wrench,
        variant: "ghost",
    },
    {
        title: "Agent Playground",
        href: "/dashboard/mcp/agent",
        icon: Bot,
        variant: "ghost",
    },
    {
        title: "Registry",
        href: "/dashboard/mcp/registry",
        icon: Download,
        variant: "ghost",
    },
    {
        title: "Tool Catalog",
        href: "/dashboard/mcp/catalog",
        icon: Search,
        variant: "ghost",
    },
    {
        title: "Documentation",
        href: "/dashboard/mcp/docs",
        icon: BookOpen,
        variant: "ghost",
    },
    {
        title: "Configuration",
        href: "/dashboard/mcp/settings",
        icon: Settings,
        variant: "ghost",
    },
];

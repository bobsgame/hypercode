import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { attachTo } from "./metamcp-proxy.service.js";
import { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";

export class MetaMCPController {
    private static instance: MetaMCPController;
    private cleanupFn: (() => Promise<void>) | null = null;

    private constructor() { }

    public static getInstance(): MetaMCPController {
        if (!MetaMCPController.instance) {
            MetaMCPController.instance = new MetaMCPController();
        }
        return MetaMCPController.instance;
    }

    public async initialize(
        server: Server,
        nativeTools: Tool[],
        nativeHandler: (name: string, args: unknown) => Promise<CallToolResult>
    ) {
        console.log("[MetaMCPController] Initializing MetaMCP Proxy extensions...");

        // Define default session for singleton Borg instance
        const namespaceUuid = "borg-core-namespace"; // Static ID for now
        const sessionId = "borg-core-session";       // Static ID for now

        const { cleanup } = await attachTo(
            server,
            namespaceUuid,
            sessionId,
            nativeTools,
            nativeHandler,
            false // includeInactiveServers
        );

        this.cleanupFn = cleanup;
        console.log("[MetaMCPController] MetaMCP extensions attached.");
    }

    public async shutdown() {
        if (this.cleanupFn) {
            console.log("[MetaMCPController] Cleaning up session...");
            await this.cleanupFn();
            this.cleanupFn = null;
        }
    }
}

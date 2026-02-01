
import { MCPServer } from '../src/MCPServer.js';

// Targets from Batch 4
const TARGETS = [
    "https://github.com/OpenCodeInterpreter/OpenCodeInterpreter",
    "https://github.com/lobehub/lobehub",
    "https://github.com/microsoft/agent-lightning",
    "https://github.com/MiroMindAI/MiroThinker"
];

async function main() {
    console.log("🚀 Starting Batch Ingestion...");
    const server = new MCPServer({ skipWebsocket: false });

    // Allow server to boot
    await new Promise(r => setTimeout(r, 2000));

    console.log("🚀 Starting Batch Ingestion (Auto-Fallback to Native Mode if no browser)...");

    for (const url of TARGETS) {
        console.log(`Processing: ${url}`);
        // We can't access private server.researchService directly easily if not exposed
        // But we added it as public? verifying... 
        // MCPServer has `public researchService`.
        const result = await server.researchService.ingest(url);
        console.log(`Result: ${result}`);

        // Cooldown
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log("✅ Batch Complete.");
    process.exit(0);
}

main().catch(console.error);

import { MCPServer } from '../packages/core/src/MCPServer.js';
import fs from 'fs/promises';
import path from 'path';

async function main() {
    console.log("Starting Node A...");
    const nodeA = new MCPServer({ skipMesh: false });
    await nodeA.start();

    console.log("Starting Node B...");
    const nodeB = new MCPServer({ skipMesh: false });
    // We don't start the full server to avoid port collisions, just initialize mesh.
    // Actually, we can just instantiate another MeshService if we only need to test federation.
    // But MCPServer constructor already setups the mesh. Let's start it without WS port or on another port if possible.

    // Instead of full servers, let's just trigger `executeTool` on Node A.

    // Setup dummy file for Node B to serve
    const testFile = path.join(process.cwd(), 'mesh_federation_test.txt');
    await fs.writeFile(testFile, 'Hello from Federated Node B!', 'utf-8');

    try {
        console.log("Execution: Node A attempts to read file...");
        const result = await nodeA.executeTool('read_file', { path: testFile });
        console.log("Node A Read Result:", JSON.stringify(result, null, 2));
    } catch (e: any) {
        console.error("Test Failed:", e);
    } finally {
        await fs.unlink(testFile).catch(() => { });
        process.exit(0);
    }
}

main().catch(console.error);

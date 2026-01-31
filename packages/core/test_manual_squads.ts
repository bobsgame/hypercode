
import { SquadService } from './src/orchestrator/SquadService.js';
import { MCPServer } from './src/MCPServer.js';
import fs from 'fs';
import path from 'path';

// Mock Server to avoid full initialization chains
class MockServer {
    modelSelector = { select: () => ({ id: 'mock-model' }) };
    permissionManager = { checkPermission: () => 'GRANTED' };
    directorConfig = { taskCooldownMs: 0 };
    council = { runConsensusSession: async () => ({ approved: true, summary: "Approved" }) };

    // Minimal tool executor
    async executeTool(name: string, args: any) {
        console.log(`[MockServer] Executing ${name}`, args);

        if (name === 'git_worktree_add') {
            // Simulate worktree creation
            const wtPath = args.path;
            if (!fs.existsSync(wtPath)) fs.mkdirSync(wtPath, { recursive: true });
            console.log(`[MockGIT] Worktree created at ${wtPath}`);
            return { content: [{ type: 'text', text: 'Worktree added' }] };
        }

        if (name === 'git_worktree_remove') {
            const wtPath = args.path;
            if (fs.existsSync(wtPath)) fs.rmSync(wtPath, { recursive: true, force: true });
            console.log(`[MockGIT] Worktree removed at ${wtPath}`);
            return { content: [{ type: 'text', text: 'Worktree removed' }] };
        }

        if (name === 'execute_command') {
            console.log(`[MockCMD] Running '${args.command}' in ${args.cwd}`);
            return { content: [{ type: 'text', text: 'Command executed' }] };
        }

        return { content: [{ type: 'text', text: 'Mock Success' }] };
    }
}

async function main() {
    console.log("🤖 Starting SquadService Verification...");

    // 1. Setup
    // @ts-ignore
    const mockServer = new MockServer();
    // @ts-ignore
    const service = new SquadService(mockServer);

    const BRANCH = 'feat/squad-test-01';
    const GOAL = 'Create a hello world file';

    // 2. Spawn Member
    console.log("\n[Step 1] Spawning Member...");
    const msg = await service.spawnMember(BRANCH, GOAL);
    console.log(`Result: ${msg}`);

    // Verify Member is listed across internal map
    const members = service.listMembers();
    if (members.length === 1 && members[0].branch === BRANCH) {
        console.log("✅ Member registered correctly.");
    } else {
        console.error("❌ Member registration failed.");
        process.exit(1);
    }

    // 3. Verify Worktree Path
    const worktreePath = path.join(process.cwd(), '.borg', 'worktrees', BRANCH);
    if (fs.existsSync(worktreePath)) {
        console.log(`✅ Worktree directory exists: ${worktreePath}`);
    } else {
        // In this mock, we create it manually in the tool handler, so it should exist.
        console.error(`❌ Worktree directory missing: ${worktreePath}`);
    }

    // 4. Kill Member
    console.log("\n[Step 2] Killing Member...");
    const killMsg = await service.killMember(BRANCH);
    console.log(`Result: ${killMsg}`);

    if (service.listMembers().length === 0) {
        console.log("✅ Member removed correctly.");
    } else {
        console.error("❌ Member cleanup failed.");
    }

    // Verify FS cleanup
    if (!fs.existsSync(worktreePath)) {
        console.log("✅ Worktree directory cleaned up.");
    } else {
        console.error("❌ Worktree directory still exists.");
    }
}

main().catch(console.error);

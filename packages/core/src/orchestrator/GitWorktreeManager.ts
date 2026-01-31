
import { execAsync } from "../utils/exec.js";
import path from "path";
import fs from "fs";

export class GitWorktreeManager {
    constructor(private rootDir: string) { }

    async listWorktrees(): Promise<any[]> {
        const { stdout } = await execAsync("git worktree list --porcelain", { cwd: this.rootDir });
        const worktrees: any[] = [];
        let current: any = {};

        stdout.split('\n').forEach(line => {
            if (line.startsWith('worktree ')) {
                if (current.path) worktrees.push(current);
                current = { path: line.substring(9).trim() };
            } else if (line.startsWith('HEAD ')) {
                current.head = line.substring(5).trim();
            } else if (line.startsWith('branch ')) {
                current.branch = line.substring(7).trim();
            }
        });
        if (current.path) worktrees.push(current);
        return worktrees;
    }

    async addWorktree(branch: string, relativePath: string): Promise<string> {
        const fullPath = path.resolve(this.rootDir, relativePath);

        // Ensure parent dir exists
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });

        // Check if branch exists
        let command = `git worktree add ${fullPath} ${branch}`;
        try {
            await execAsync(`git show-ref --verify refs/heads/${branch}`, { cwd: this.rootDir });
        } catch (e) {
            // Branch doesn't exist, create it
            command = `git worktree add -b ${branch} ${fullPath}`;
        }

        console.log(`[GitWorktree] Adding worktree: ${command}`);
        await execAsync(command, { cwd: this.rootDir });
        return fullPath;
    }

    async removeWorktree(pathOrBranch: string, force: boolean = false): Promise<void> {
        let command = `git worktree remove ${pathOrBranch}`;
        if (force) command += " --force";

        console.log(`[GitWorktree] Removing worktree: ${command}`);
        await execAsync(command, { cwd: this.rootDir });
    }
}

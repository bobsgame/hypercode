import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const SUBMODULES_DOC = path.join(ROOT_DIR, 'SUBMODULES.md');
const DOCS_SUBMODULES_DOC = path.join(ROOT_DIR, 'docs', 'SUBMODULES.md');

async function main() {
    const output = execSync('git submodule status', { encoding: 'utf-8' });
    const rawSubmodules = output.split(/\r?\n/).filter(Boolean);
    const submoduleMap = new Map();

    // Parse existing MD to preserve descriptions from root SUBMODULES.md
    if (fs.existsSync(SUBMODULES_DOC)) {
        const content = fs.readFileSync(SUBMODULES_DOC, 'utf-8');
        const lines = content.split(/\r?\n/);
        let inTable = false;

        for (const line of lines) {
            if (line.startsWith('| Submodule |')) {
                inTable = true;
                continue;
            }
            if (line.startsWith('| :---')) continue;

            if (inTable && line.startsWith('|')) {
                const parts = line.split('|').map(p => p.trim()).filter(p => p !== '');
                if (parts.length >= 2) {
                    const pathVal = parts[1].replace(/`/g, '');
                    const desc = parts[2] || '';
                    submoduleMap.set(pathVal, desc);
                }
            }
        }
    }

    // Build new list
    const newEntries = [];

    for (const line of rawSubmodules) {
        const match = line.match(/^\s*([+\-U\s])?([a-f0-9]+)\s+(.+?)\s+(\((.+?)\))?$/);
        if (match) {
            const subPath = match[3];
            const version = match[5] || 'HEAD';

            const name = path.basename(subPath);
            const desc = submoduleMap.get(subPath) || 'Integrated submodule.';

            newEntries.push({ name, path: subPath, desc, version });
        }
    }

    newEntries.sort((a, b) => a.path.localeCompare(b.path));

    let newContent = `# Submodule Dashboard

`;
    newContent += `This document tracks the status, location, and purpose of all submodules in the borg ecosystem.

`;
    newContent += `| Submodule | Path | Version | Description |
`;
    newContent += `| :--- | :--- | :--- | :--- |
`;

    for (const entry of newEntries) {
        const safeDesc = entry.desc.replace(/\|/g, '\|');
        newContent += `| **${entry.name}** | ${entry.path} | ${entry.version} | ${safeDesc} |
`;
    }

    newContent += `
## Directory Structure

`;
    newContent += '```\n';
    newContent += `borg/\n`;
    newContent += `├── packages/           # Monorepo packages\n`;
    newContent += `├── submodules/         # Core integrated submodules (Active)\n`;
    newContent += `├── references/         # Reference implementations (Passive)\n`;
    newContent += `├── docs/               # Documentation\n`;
    newContent += `├── agents/             # Agent definitions\n`;
    newContent += `├── hooks/              # System hooks\n`;
    newContent += `├── mcp-servers/        # Local MCP servers\n`;
    newContent += `└── skills/             # Universal skills\n`;
    newContent += '```\n';

    fs.writeFileSync(SUBMODULES_DOC, newContent);
    fs.writeFileSync(DOCS_SUBMODULES_DOC, newContent);
    console.log(`Updated both ${SUBMODULES_DOC} and ${DOCS_SUBMODULES_DOC} with ${newEntries.length} entries.`);
}

main().catch(console.error);

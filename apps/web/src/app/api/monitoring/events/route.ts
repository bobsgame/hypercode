
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
    try {
        const logDir = path.join(process.cwd(), '../../../.borg/data'); // Relative to apps/web/src/app/api...
        // Wait, process.cwd() in Next.js might be the root of the repo or apps/web.
        // Usually it's the project root if run from there, or apps/web.
        // Let's assume repo root or try to find .borg.
        // Safest is to check multiple paths or use an absolute path environment variable.
        // But for this environment: c:\Users\hyper\workspace\borg
        // If next runs in apps/web, then .borg is at ../../.borg

        // Let's try to detect the root.
        let rootDir = process.cwd();
        if (rootDir.endsWith('web')) {
            rootDir = path.join(rootDir, '../../');
        } else if (rootDir.endsWith('apps')) { // Unlikely
            rootDir = path.join(rootDir, '../');
        }

        const logFile = path.join(rootDir, '.borg/data/healer_events.jsonl');

        try {
            await fs.access(logFile);
        } catch {
            return NextResponse.json({ events: [] });
        }

        const data = await fs.readFile(logFile, 'utf-8');
        const lines = data.trim().split('\n');

        // Parse and reverse to show newest first
        const events = lines
            .map(line => {
                try { return JSON.parse(line); } catch { return null; }
            })
            .filter(Boolean)
            .reverse()
            .slice(0, 50); // Limit to last 50

        return NextResponse.json({ events });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

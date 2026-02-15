
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Resolve the monorepo root safely without overly broad path traversals
function getMonorepoRoot(): string {
    return process.env.BORG_ROOT || path.resolve(process.cwd(), '..', '..');
}

const PROMPTS_DIR = path.join(getMonorepoRoot(), '.borg', 'prompts');

export async function GET() {
    try {
        await fs.mkdir(PROMPTS_DIR, { recursive: true });
        const files = await fs.readdir(PROMPTS_DIR);
        const prompts = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(path.join(PROMPTS_DIR, file), 'utf-8');
                try {
                    prompts.push(JSON.parse(content));
                } catch { }
            }
        }

        return NextResponse.json({ prompts });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, template, description } = body;

        if (!id || !template) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const filePath = path.join(PROMPTS_DIR, `${id}.json`);

        // Read existing to bump version
        let version = 1;
        try {
            const existing = JSON.parse(await fs.readFile(filePath, 'utf-8'));
            version = (existing.version || 0) + 1;
        } catch { }

        const promptData = {
            id,
            version,
            description: description || "",
            template,
            variables: [], // TODO: Parse variables from template regex
            updatedAt: new Date().toISOString()
        };

        await fs.writeFile(filePath, JSON.stringify(promptData, null, 2));

        return NextResponse.json({ success: true, prompt: promptData });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

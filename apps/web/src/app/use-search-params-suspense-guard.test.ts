import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const APP_DIR = path.resolve(__dirname);

function walk(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === ".next") {
            continue;
        }

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walk(fullPath));
        } else {
            files.push(fullPath);
        }
    }

    return files;
}

function normalize(p: string): string {
    return p.replace(/\\/g, "/");
}

describe("App Router useSearchParams safety", () => {
    it("wraps page-level useSearchParams usage in a Suspense boundary", () => {
        const pageFiles = walk(APP_DIR)
            .map(normalize)
            .filter((file) => file.endsWith("/page.tsx"));

        const offenders: string[] = [];

        for (const file of pageFiles) {
            const source = fs.readFileSync(file, "utf8");
            if (!source.includes("useSearchParams")) {
                continue;
            }

            const hasSuspenseImport = /import\s+[^;]*\bSuspense\b[^;]*from\s+["']react["']/.test(source)
                || /import\s+\*\s+as\s+React\s+from\s+["']react["']/.test(source);
            const hasSuspenseUsage = /<Suspense\b/.test(source);

            if (!hasSuspenseImport || !hasSuspenseUsage) {
                offenders.push(file);
            }
        }

        expect(
            offenders,
            `Pages using useSearchParams without Suspense import/usage: ${JSON.stringify(offenders, null, 2)}`,
        ).toEqual([]);
    });
});

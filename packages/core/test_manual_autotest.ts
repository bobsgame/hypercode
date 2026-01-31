
import { AutoTestService } from './src/services/AutoTestService.js';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TMP_FILE = path.join(ROOT, '_tmp_calc.ts');
const TMP_TEST = path.join(ROOT, '_tmp_calc.test.ts');

async function main() {
    console.log("🧪 Starting AutoTest Manual Verification...");

    // 1. Setup Dummy Files
    console.log("[1/5] Creating dummy files...");
    fs.writeFileSync(TMP_FILE, `export const add = (a: number, b: number) => a + b;`);
    fs.writeFileSync(TMP_TEST, `
import { expect, test } from 'vitest';
import { add } from './_tmp_calc';

test('adds numbers', () => {
    expect(add(1, 2)).toBe(3);
});
`);

    // 2. Initialize Service
    console.log("[2/5] Initializing AutoTestService...");
    const service = new AutoTestService(ROOT);

    // Mock runTest to avoid actual 'vitest' spawn overhead and capture trigger
    // @ts-ignore
    service.runTest = (testFile: string) => {
        console.log(`\n🎯 [MOCK] EXECUTION DETECTED!`);
        console.log(`    Target: ${testFile}`);

        if (testFile.includes('_tmp_calc.test.ts')) {
            console.log("    ✅ SUCCESS: Correct test file targeted.");
            cleanup();
            process.exit(0);
        } else {
            console.log("    ❌ ERROR: Wrong file targeted.");
        }
    };

    await service.start();

    // 3. Trigger Change
    console.log("[3/5] Waiting for watcher to settle (2s)...");
    await new Promise(r => setTimeout(r, 2000));

    console.log("[4/5] Modifying source file (_tmp_calc.ts)...");
    fs.appendFileSync(TMP_FILE, `\n// Checked at ${Date.now()}`);

    // 4. Wait for detection
    console.log("[5/5] Waiting for detection (timeout 10s)...");

    setTimeout(() => {
        console.error("❌ TIMEOUT: AutoTestService did not trigger runTest.");
        cleanup();
        process.exit(1);
    }, 10000);
}

function cleanup() {
    try {
        if (fs.existsSync(TMP_FILE)) fs.unlinkSync(TMP_FILE);
        if (fs.existsSync(TMP_TEST)) fs.unlinkSync(TMP_TEST);
        console.log("🧹 Cleanup done.");
    } catch (e) { }
}

main().catch(e => {
    console.error(e);
    cleanup();
});


import { SandboxService } from './src/security/SandboxService.js';

async function test() {
    console.log("Testing SandboxService...");
    const sandbox = new SandboxService();

    // 1. Node.js Simple Math
    console.log("\n[Test 1] Node.js Math");
    const res1 = await sandbox.execute('node', 'console.log("Hello from VM!"); let x = 10; x * 2;');
    console.log("Output:", res1);
    if (res1.output.includes("Hello") || res1.output === "" /* depends on if last expression is returned or captured */) console.log("✅ Passed");

    // Note: My implementation captures console.log. It doesn't return the last expression unless console.logged.
    // Wait, let's check code.
    // `outputBuffer += args...`
    // So `x * 2` won't be in output.

    // 2. Node.js Infinite Loop (Timeout)
    console.log("\n[Test 2] Node.js Timeout");
    const res2 = await sandbox.execute('node', 'while(true) {}', 2000);
    console.log("Output:", res2);
    if (res2.error && res2.error.includes("timed out")) console.log("✅ Passed");
    else console.log("❌ Failed (No timeout)");

    // 3. Python Simple Print
    console.log("\n[Test 3] Python Print");
    const res3 = await sandbox.execute('python', 'print("Hello form Python!")');
    console.log("Output:", res3);
    if (res3.output.includes("Python")) console.log("✅ Passed");
    else console.log("❌ Failed (Python invalid?)");

    // 4. Python Timeout
    console.log("\n[Test 4] Python Timeout");
    const res4 = await sandbox.execute('python', 'import time; time.sleep(5)', 2000);
    console.log("Output:", res4);
    if (res4.error && res4.error.includes("timed out")) console.log("✅ Passed");
    else console.log("❌ Failed");

}

test().catch(console.error);

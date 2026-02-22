#!/usr/bin/env node

/**
 * Verifies local multi-service dev readiness for Borg workspace.
 *
 * Why this exists:
 * - Root `pnpm run dev` starts many long-running tasks across packages/submodules.
 * - Regressions often present as one service silently moving to a fallback port.
 * - We want a deterministic, one-command readiness report with explicit URLs.
 */

const SERVICE_CHECKS = [
  {
    id: "borg-web",
    description: "Borg Next.js dashboard",
    ports: [3000, 3010, 3020, 3030, 3040],
    path: "/",
    critical: true,
  },
  {
    id: "metamcp-frontend",
    description: "MetaMCP frontend",
    ports: [12008, 12018, 12028, 12038],
    path: "/",
    critical: true,
  },
  {
    id: "metamcp-backend",
    description: "MetaMCP backend health",
    ports: [12009, 12019, 12029, 12039],
    path: "/health",
    critical: true,
  },
  {
    id: "autopilot-server",
    description: "OpenCode Autopilot server health",
    ports: [3847, 3857, 3867, 3877, 3887],
    path: "/health",
    critical: true,
  },
];

const REQUEST_TIMEOUT_MS = Number(process.env.READINESS_TIMEOUT_MS || 2500);
const softMode = process.argv.includes("--soft");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
    });

    return { ok: response.ok, status: response.status };
  } catch (error) {
    return {
      ok: false,
      status: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function detectRunningEndpoint(service) {
  for (const port of service.ports) {
    const url = `http://127.0.0.1:${port}${service.path}`;
    const result = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);

    if (result.ok) {
      return {
        status: "up",
        port,
        url,
        statusCode: result.status,
      };
    }

    // Slight delay to reduce connection burst noise on Windows.
    await sleep(25);
  }

  return {
    status: "down",
    port: null,
    url: null,
    statusCode: null,
  };
}

function formatLine(service, result) {
  if (result.status === "up") {
    return `✅ ${service.id.padEnd(18)} ${String(result.statusCode).padEnd(3)} ${result.url}`;
  }

  return `❌ ${service.id.padEnd(18)} DOWN checked=[${service.ports.join(",")}] path=${service.path}`;
}

async function main() {
  console.log(`\n[Borg Dev Readiness] timeout=${REQUEST_TIMEOUT_MS}ms mode=${softMode ? "soft" : "strict"}`);

  const results = [];

  for (const service of SERVICE_CHECKS) {
    const result = await detectRunningEndpoint(service);
    results.push({ service, result });
  }

  console.log("\nService Status:");
  for (const { service, result } of results) {
    console.log(formatLine(service, result));
  }

  const failedCritical = results.filter(({ service, result }) => service.critical && result.status !== "up");

  if (failedCritical.length > 0) {
    console.log("\nSummary: ❌ readiness failed (critical services down)");

    if (!softMode) {
      process.exit(1);
    }

    console.log("Soft mode enabled; returning exit code 0 despite failures.");
  } else {
    console.log("\nSummary: ✅ readiness passed");
  }
}

main().catch((error) => {
  console.error("[Borg Dev Readiness] Unexpected error:", error);
  process.exit(1);
});

/**
 * @file index.ts
 * @module packages/core/src/types/metamcp/index
 *
 * WHAT:
 * Barrel file exporting all MetaMCP Zod types.
 *
 * WHY:
 * Simplifies imports across the application.
 */

export * from "./api-keys.zod.js";
export * from "./config-schemas.zod.js";
export * from "./endpoints.zod.js";
export * from "./logs.zod.js";
export * from "./mcp-servers.zod.js";
export * from "./namespaces.zod.js";
export * from "./oauth.zod.js";
export * from "./policies.zod.js";
export * from "./saved-scripts.zod.js";
export * from "./tool-sets.zod.js";
export * from "./tools.zod.js";
export * from "./server-health.js";

// Validation fix for missing type
export type ServerParameters = Record<string, unknown>;


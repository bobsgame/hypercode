/**
 * @file mcp-servers.repo.ts
 * @module packages/core/src/db/repositories/mcp-servers.repo
 *
 * WHAT:
 * Repository for managing MCP Servers in the database.
 *
 * WHY:
 * Handles CRUD operations for MCP Servers, including user scoping and validation.
 *
 * HOW:
 * - Uses Drizzle ORM to query `mcpServersTable`.
 * - Handles PostgreSQL errors via `handleDatabaseError` (adapted for likely SQLite usage).
 * - Manages 'ACTIVE'/'INACTIVE' status.
 */

import {
    DatabaseMcpServer,
    McpServerCreateInput,
    McpServerErrorStatusEnum,
    McpServerUpdateInput,
} from "../../types/metamcp/index.js";
import { and, eq, isNull, or } from "drizzle-orm";
// import { DatabaseError } from "pg"; // Generic error handling preferred for dual-db support
import { z } from "zod";

import { randomUUID } from "node:crypto";
import * as fs from "fs/promises";
import * as path from "path";


// Keep console-backed logger until centralized logger wiring is introduced in this package.
const logger = console;

import { db } from "../index.js";
import { mcpServersTable } from "../metamcp-schema.js";

type McpServerRow = typeof mcpServersTable.$inferSelect;
type McpServerInsert = typeof mcpServersTable.$inferInsert;

function normalizeErrorStatus(
    status: z.infer<typeof McpServerErrorStatusEnum>,
): McpServerInsert["error_status"] {
    // The shared Zod enum includes "ERROR" for legacy compatibility,
    // but the DB column only accepts concrete error categories.
    return status === "ERROR" ? "INTERNAL_ERROR" : status;
}

// Helper function to handle Database errors (PostgreSQL & SQLite)
function handleDatabaseError(
    error: unknown,
    operation: string,
    serverName?: string,
): never {
    logger.error(`Database error in ${operation}:`, error);

    // Simplified error handling for Phase 1
    // We can expand this to check for specific PG/SQLite codes later
    // e.g. SQLite "SQLITE_CONSTRAINT: UNIQUE constraint failed"

    const errString = String(error);

    if (errString.includes("UNIQUE constraint failed") || errString.includes("23505")) {
        throw new Error(
            `Server name "${serverName}" already exists. Server names must be unique within your scope.`,
        );
    }

    // Handle regex constraint (Check constraint in PG, might be trigger or app logic in SQLite)
    // We rely on Zod validation mostly, but DB constraints catch edge cases.

    // For any other database errors, throw a generic user-friendly message
    throw new Error(
        `Failed to ${operation} MCP server. Please check your input and try again.`,
    );
}

export class McpServersRepository {
    async create(input: McpServerCreateInput, options?: { skipSync?: boolean }): Promise<DatabaseMcpServer> {
        try {
            const payload: McpServerInsert = {
                uuid: randomUUID(),
                name: input.name,
                description: input.description ?? null,
                type: input.type,
                command: input.command ?? null,
                args: input.args ?? [],
                env: input.env ?? {},
                url: input.url ?? null,
                bearerToken: input.bearerToken ?? null,
                headers: input.headers ?? {},
                user_id: input.user_id ?? "system",
            };

            const [createdServer] = await db
                .insert(mcpServersTable)
                .values(payload)
                .returning();

            if (!options?.skipSync) {
                await this.syncToMcpJson();
            }
            return createdServer;
        } catch (error) {
            handleDatabaseError(error, "create", input.name);
        }
    }

    async findAll(userId?: string): Promise<DatabaseMcpServer[]> {
        try {
            if (userId) {
                return await db
                    .select()
                    .from(mcpServersTable)
                    .where(eq(mcpServersTable.user_id, userId));
            }
            return await db.select().from(mcpServersTable);
        } catch (error) {
            handleDatabaseError(error, "findAll");
        }
    }

    async findPublicMcpServers(): Promise<DatabaseMcpServer[]> {
        try {
            return await db
                .select()
                .from(mcpServersTable)
                .where(isNull(mcpServersTable.user_id));
        } catch (error) {
            handleDatabaseError(error, "findPublicMcpServers");
        }
    }

    async findAccessibleToUser(userId: string): Promise<DatabaseMcpServer[]> {
        try {
            return await db
                .select()
                .from(mcpServersTable)
                .where(
                    or(
                        eq(mcpServersTable.user_id, userId),
                        isNull(mcpServersTable.user_id),
                    ),
                );
        } catch (error) {
            handleDatabaseError(error, "findAccessibleToUser");
        }
    }

    async findByUuid(uuid: string): Promise<DatabaseMcpServer | undefined> {
        try {
            const [server] = await db
                .select()
                .from(mcpServersTable)
                .where(eq(mcpServersTable.uuid, uuid));
            return server;
        } catch (error) {
            handleDatabaseError(error, "findByUuid");
        }
    }

    async findByName(name: string): Promise<DatabaseMcpServer | undefined> {
        try {
            const [server] = await db
                .select()
                .from(mcpServersTable)
                .where(eq(mcpServersTable.name, name));
            return server;
        } catch (error) {
            handleDatabaseError(error, "findByName");
        }
    }

    // Find server by name within user scope (for uniqueness checks)
    async findByNameAndUserId(
        name: string,
        userId: string | null,
    ): Promise<DatabaseMcpServer | undefined> {
        const [server] = await db
            .select() // .select() implicit returns all fields in Drizzle usually, but better to be safe
            .from(mcpServersTable)
            .where(
                and(
                    eq(mcpServersTable.name, name),
                    userId
                        ? eq(mcpServersTable.user_id, userId)
                        : isNull(mcpServersTable.user_id),
                ),
            )
            .limit(1);

        return server;
    }

    async findByUuidAndUser(
        uuid: string,
        userId: string,
    ): Promise<DatabaseMcpServer | undefined> {
        try {
            const [server] = await db
                .select()
                .from(mcpServersTable)
                .where(
                    and(
                        eq(mcpServersTable.uuid, uuid),
                        eq(mcpServersTable.user_id, userId),
                    ),
                );
            return server;
        } catch (error) {
            handleDatabaseError(error, "findByUuidAndUser");
        }
    }

    async deleteByUuid(uuid: string): Promise<DatabaseMcpServer | undefined> {
        const [deletedServer] = await db
            .delete(mcpServersTable)
            .where(eq(mcpServersTable.uuid, uuid))
            .returning();

        await this.syncToMcpJson();
        return deletedServer;
    }

    async update(input: McpServerUpdateInput, options?: { skipSync?: boolean }): Promise<DatabaseMcpServer> {
        try {
            const { uuid, user_id, ...updates } = input;
            const payload: Partial<McpServerInsert> = {
                ...updates,
                ...(user_id === undefined
                    ? {}
                    : { user_id: user_id ?? "system" }),
            };

            const [updatedServer] = await db
                .update(mcpServersTable)
                .set(payload)
                .where(eq(mcpServersTable.uuid, uuid))
                .returning();

            if (!updatedServer) {
                throw new Error(`MCP Server with UUID ${input.uuid} not found.`);
            }

            if (!options?.skipSync) {
                await this.syncToMcpJson();
            }
            return updatedServer;
        } catch (error) {
            handleDatabaseError(error, "update", input.name);
        }
    }

    async updateErrorStatus(
        uuid: string,
        status: z.infer<typeof McpServerErrorStatusEnum>,
    ): Promise<void> {
        try {
            await db
                .update(mcpServersTable)
                .set({ error_status: normalizeErrorStatus(status) })
                .where(eq(mcpServersTable.uuid, uuid));
        } catch (error) {
            handleDatabaseError(error, "updateErrorStatus");
        }
    }

    async bulkCreate(
        servers: McpServerCreateInput[],
    ): Promise<DatabaseMcpServer[]> {
        try {
            const payload: McpServerInsert[] = servers.map((server) => ({
                uuid: randomUUID(),
                name: server.name,
                description: server.description ?? null,
                type: server.type,
                command: server.command ?? null,
                args: server.args ?? [],
                env: server.env ?? {},
                url: server.url ?? null,
                bearerToken: server.bearerToken ?? null,
                headers: server.headers ?? {},
                user_id: server.user_id ?? "system",
            }));

            const result = await db.insert(mcpServersTable).values(payload).returning();
            await this.syncToMcpJson();
            return result;
        } catch (error: unknown) {
            // Simplified bulk error handling
            console.error("Database error in bulk create:", error);
            throw new Error(
                "Failed to bulk create MCP servers. Please check your input and try again.",
            );
        }
    }

    async updateServerErrorStatus(input: {
        serverUuid: string;
        errorStatus: z.infer<typeof McpServerErrorStatusEnum>;
    }): Promise<McpServerRow | undefined> {
        const [updatedServer] = await db
            .update(mcpServersTable)
            .set({
                error_status: normalizeErrorStatus(input.errorStatus),
            })
            .where(eq(mcpServersTable.uuid, input.serverUuid))
            .returning();

        // Note: We generally don't sync status updates to mcp.json as it's a configuration file
        return updatedServer;
    }

    public async syncToMcpJson(): Promise<void> {
        try {
            const allServers = await this.findAll();
            const jsonOutput: Record<string, any> = { mcpServers: {} };

            for (const server of allServers) {
                // Skip if name is invalid or missing
                if (!server.name) continue;

                const config: any = {
                    command: server.command,
                    args: server.args,
                    env: server.env,
                };

                // Only include fields if they are relevant/present
                if (!config.command) delete config.command;
                if (!config.args || config.args.length === 0) delete config.args;
                if (!config.env || Object.keys(config.env).length === 0) delete config.env;

                // Handle different types if needed (e.g. SSE url)
                if (server.type !== 'STDIO' && server.url) {
                    config.url = server.url;
                }

                // If specialized type, might iterate on schema
                // For now, mapping simplified 'stdio' style config
                jsonOutput.mcpServers[server.name] = config;
            }

            const mcpJsonPath = path.resolve(process.cwd(), "mcp.json");
            await fs.writeFile(mcpJsonPath, JSON.stringify(jsonOutput, null, 2), "utf-8");
        } catch (error) {
            console.error("Failed to sync mcp.json:", error);
            // Don't throw, as DB operation succeeded
        }
    }
}

export const mcpServersRepository = new McpServersRepository();

// @ts-nocheck
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

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

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

// import logger from "@/utils/logger"; // TODO: Port logger or use console
const logger = console;

import { db } from "../index.js";
import { mcpServersTable } from "../metamcp-schema.js";

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
    async create(input: McpServerCreateInput): Promise<DatabaseMcpServer> {
        try {
            // @ts-ignore
            const [createdServer] = await db
                .insert(mcpServersTable as any)
                .values({
                    uuid: randomUUID(),
                    ...input,
                } as any)
                .returning() as any;

            return createdServer;
        } catch (error) {
            handleDatabaseError(error, "create", input.name);
        }
    }

    async findAll(userId?: string): Promise<DatabaseMcpServer[]> {
        try {
            if (userId) {
                // @ts-ignore
                return await db
                    .select()
                    .from(mcpServersTable as any)
                    .where(eq(mcpServersTable.user_id as any, userId)) as any;
            }
            // @ts-ignore
            return await db.select().from(mcpServersTable as any) as any;
        } catch (error) {
            handleDatabaseError(error, "findAll");
        }
    }

    async findPublicMcpServers(): Promise<DatabaseMcpServer[]> {
        try {
            // @ts-ignore
            return await db
                .select()
                .from(mcpServersTable as any)
                .where(isNull(mcpServersTable.user_id as any)) as any;
        } catch (error) {
            handleDatabaseError(error, "findPublicMcpServers");
        }
    }

    async findAccessibleToUser(userId: string): Promise<DatabaseMcpServer[]> {
        try {
            // @ts-ignore
            return await db
                .select()
                .from(mcpServersTable as any)
                .where(
                    or(
                        eq(mcpServersTable.user_id as any, userId),
                        isNull(mcpServersTable.user_id as any),
                    ) as any,
                ) as any;
        } catch (error) {
            handleDatabaseError(error, "findAccessibleToUser");
        }
    }

    async findByUuid(uuid: string): Promise<DatabaseMcpServer | undefined> {
        try {
            // @ts-ignore
            const [server] = await db
                .select()
                .from(mcpServersTable as any)
                .where(eq(mcpServersTable.uuid as any, uuid)) as any;
            return server;
        } catch (error) {
            handleDatabaseError(error, "findByUuid");
        }
    }

    async findByName(name: string): Promise<DatabaseMcpServer | undefined> {
        try {
            // @ts-ignore
            const [server] = await db
                .select()
                .from(mcpServersTable as any)
                .where(eq(mcpServersTable.name as any, name)) as any;
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
            .from(mcpServersTable as any)
            .where(
                and(
                    eq(mcpServersTable.name as any, name),
                    userId
                        ? eq(mcpServersTable.user_id as any, userId)
                        : isNull(mcpServersTable.user_id as any),
                ) as any,
            )
            .limit(1) as any;

        return server;
    }

    async findByUuidAndUser(
        uuid: string,
        userId: string,
    ): Promise<DatabaseMcpServer | undefined> {
        try {
            // @ts-ignore
            const [server] = await db
                .select()
                .from(mcpServersTable as any)
                .where(
                    and(
                        eq(mcpServersTable.uuid as any, uuid),
                        eq(mcpServersTable.user_id as any, userId),
                    ) as any,
                ) as any;
            return server;
        } catch (error) {
            handleDatabaseError(error, "findByUuidAndUser");
        }
    }

    async deleteByUuid(uuid: string): Promise<DatabaseMcpServer | undefined> {
        const [deletedServer] = await db
            .delete(mcpServersTable as any)
            .where(eq(mcpServersTable.uuid as any, uuid))
            .returning() as any;

        return deletedServer;
    }

    async update(input: McpServerUpdateInput): Promise<DatabaseMcpServer> {
        try {
            // @ts-ignore
            const [updatedServer] = await db
                .update(mcpServersTable as any)
                .set({
                    ...input,
                    ...(input.error_status === null
                        ? { error_status: "NONE" } // Reset error status if null passed or logic dictates
                        : {}),
                } as any)
                .where(eq(mcpServersTable.uuid as any, input.uuid))
                .returning() as any;

            if (!updatedServer) {
                throw new Error(`MCP Server with UUID ${input.uuid} not found.`);
            }

            return updatedServer;
        } catch (error) {
            handleDatabaseError(error, "update", input.name);
        }
    }

    async updateErrorStatus(
        uuid: string,
        status: McpServerErrorStatusEnum,
    ): Promise<void> {
        try {
            // @ts-ignore
            await db
                .update(mcpServersTable as any)
                .set({ error_status: status } as any)
                .where(eq(mcpServersTable.uuid as any, uuid)) as any;
        } catch (error) {
            handleDatabaseError(error, "updateErrorStatus");
        }
    }

    async bulkCreate(
        servers: McpServerCreateInput[],
    ): Promise<DatabaseMcpServer[]> {
        try {
            return await db.insert(mcpServersTable as any).values(servers as any).returning() as any;
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
    }) {
        const [updatedServer] = await db
            .update(mcpServersTable as any)
            .set({
                error_status: input.errorStatus as any,
            } as any)
            .where(eq(mcpServersTable.uuid as any, input.serverUuid))
            .returning() as any;

        return updatedServer;
    }
}

export const mcpServersRepository = new McpServersRepository();

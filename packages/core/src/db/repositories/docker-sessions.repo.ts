/**
 * @file docker-sessions.repo.ts
 * @module packages/core/src/db/repositories/docker-sessions.repo
 *
 * WHAT:
 * Repository for Docker Sessions.
 *
 * WHY:
 * Tracks running Docker containers for MCP servers created dynamically.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

// Schema definition for Create input (since not in Zod types explicitly yet? check imports)
// Assuming we match the table insert structure.
import { eq } from "drizzle-orm"; // Removed desc

import { db } from "../index.js";
import { dockerSessionsTable } from "../metamcp-schema.js";
import { randomUUID } from "node:crypto";

export class DockerSessionsRepository {
    async create(input: any): Promise<any> {
        // @ts-ignore
        const [session] = await db
            .insert(dockerSessionsTable as any)
            .values({
                ...input,
                uuid: randomUUID(),
            } as any)
            .returning() as any;

        return session;
    }

    async findByMcpServerUuid(mcpServerUuid: string) {
        // @ts-ignore
        const [session] = await db
            .select()
            .from(dockerSessionsTable as any)
            .where(eq(dockerSessionsTable.mcp_server_uuid as any, mcpServerUuid)) as any;

        return session;
    }

    async updateStatus(containerId: string, status: string) {
        // @ts-ignore
        const [updatedSession] = await db
            .update(dockerSessionsTable as any)
            .set({
                status: status,
                updated_at: new Date(),
            } as any)
            .where(eq(dockerSessionsTable.container_id as any, containerId))
            .returning() as any;

        return updatedSession;
    }

    async delete(uuid: string) {
        // @ts-ignore
        const [deletedSession] = await db
            .delete(dockerSessionsTable as any)
            .where(eq(dockerSessionsTable.uuid as any, uuid))
            .returning() as any;

        return deletedSession;
    }
}

export const dockerSessionsRepository = new DockerSessionsRepository();

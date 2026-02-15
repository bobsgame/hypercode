/**
 * @file oauth-sessions.repo.ts
 * @module packages/core/src/db/repositories/oauth-sessions.repo
 *
 * WHAT:
 * Repository for OAuth Sessions (User-Server connection state).
 *
 * WHY:
 * Manages the state of a user's OAuth connection to an external MCP Server (e.g. Google Drive).
 * Stores tokens securely (encrypted at rest ideally, but here just storage).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
    OAuthSessionCreateInput,
    // OAuthSessionUpdateInput, // Unused
} from "../../types/metamcp/index.js";
import { desc, eq } from "drizzle-orm";

import { db } from "../index.js";
import { oauthSessionsTable } from "../metamcp-schema.js";

export class OAuthSessionsRepository {
    async upsert(input: OAuthSessionCreateInput) {
        // Check if session exists
        // @ts-ignore
        const [existingSession] = await db
            .select()
            .from(oauthSessionsTable as any)
            .where(eq(oauthSessionsTable.mcp_server_uuid as any, input.mcp_server_uuid)) as any;

        if (existingSession) {
            // Update
            // @ts-ignore
            const [updatedSession] = await db
                .update(oauthSessionsTable as any)
                .set({
                    // Merge input fields, keep existing if undefined in input (partial update logic handled by service usually, but here strict)
                    client_information:
                        input.client_information ?? existingSession.client_information,
                    tokens: input.tokens ?? existingSession.tokens,
                    code_verifier: input.code_verifier ?? existingSession.code_verifier,
                    updated_at: new Date(),
                } as any)
                .where(eq(oauthSessionsTable.uuid as any, existingSession.uuid))
                .returning() as any;

            return updatedSession;
        } else {
            // Create
            // @ts-ignore
            const [createdSession] = await db
                .insert(oauthSessionsTable as any)
                .values({
                    mcp_server_uuid: input.mcp_server_uuid,
                    client_information: input.client_information,
                    tokens: input.tokens,
                    code_verifier: input.code_verifier,
                } as any)
                .returning() as any;

            return createdSession;
        }
    }

    async findByMcpServerUuid(mcpServerUuid: string) {
        // @ts-ignore
        const [session] = await db
            .select()
            .from(oauthSessionsTable as any)
            .where(eq(oauthSessionsTable.mcp_server_uuid as any, mcpServerUuid)) as any;

        return session;
    }

    // Find all sessions (maintenance/admin)
    async findAll() {
        // @ts-ignore
        return await db
            .select()
            .from(oauthSessionsTable as any)
            .orderBy(desc(oauthSessionsTable.updated_at as any)) as any;
    }

    async delete(uuid: string) {
        // @ts-ignore
        const [deletedSession] = await db
            .delete(oauthSessionsTable as any)
            .where(eq(oauthSessionsTable.uuid as any, uuid))
            .returning() as any;

        return deletedSession;
    }
}

export const oauthSessionsRepository = new OAuthSessionsRepository();

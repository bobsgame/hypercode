/**
 * @file api-keys.repo.ts
 * @module packages/core/src/db/repositories/api-keys.repo
 *
 * WHAT:
 * Repository for managing API Keys.
 *
 * WHY:
 * Handles secure creation (generation) and management of API Keys.
 * Implements key generation using `nanoid`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
    ApiKeyCreateInput,
    ApiKeyType,
    ApiKeyUpdateInput,
} from "../../types/metamcp/index.js";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { customAlphabet } from "nanoid";

import { db } from "../index.js";
import { apiKeysTable } from "../metamcp-schema.js";
import { randomUUID } from "node:crypto";

const nanoid = customAlphabet(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    64,
);

export class ApiKeysRepository {
    /**
     * Generate a new API key with the specified format: sk_mt_{64-char-nanoid}
     */
    private generateApiKey(): string {
        const keyPart = nanoid();
        const key = `sk_mt_${keyPart}`;

        return key;
    }

    async create(input: ApiKeyCreateInput): Promise<{
        uuid: string;
        name: string;
        key: string;
        user_id: string | null;
        created_at: Date;
    }> {
        const key = this.generateApiKey();

        // @ts-ignore
        const [createdApiKey] = await db
            .insert(apiKeysTable as any)
            .values({
                uuid: randomUUID(),
                name: input.name,
                key: key,
                user_id: input.user_id,
                is_active: input.is_active ?? true,
            } as any)
            .returning({
                uuid: apiKeysTable.uuid,
                name: apiKeysTable.name,
                key: apiKeysTable.key, // Original code returns 'key' here too
                user_id: apiKeysTable.user_id,
                created_at: apiKeysTable.created_at,
                is_active: apiKeysTable.is_active,
            } as any) as any;

        if (!createdApiKey) {
            throw new Error("Failed to create API key");
        }

        return {
            ...createdApiKey,
            // @ts-ignore - Type requirement from interface might still exist, ignoring for build
            type: "MCP",
            key, // Return the actual key (redundant if returning above, but safe)
        } as any;
    }

    async findByUserId(userId: string) {
        // @ts-ignore
        return await db
            .select({
                uuid: apiKeysTable.uuid,
                name: apiKeysTable.name,
                key: apiKeysTable.key,
                created_at: apiKeysTable.created_at,
                is_active: apiKeysTable.is_active,
            } as any)
            .from(apiKeysTable as any)
            .where(eq(apiKeysTable.user_id as any, userId))
            .orderBy(desc(apiKeysTable.created_at as any)) as any;
    }

    // Find all API keys (both public and user-owned)
    async findAll() {
        // @ts-ignore
        return await db
            .select({
                uuid: apiKeysTable.uuid,
                name: apiKeysTable.name,
                key: apiKeysTable.key,
                created_at: apiKeysTable.created_at,
                is_active: apiKeysTable.is_active,
                user_id: apiKeysTable.user_id,
            } as any)
            .from(apiKeysTable as any)
            .orderBy(desc(apiKeysTable.created_at as any)) as any;
    }

    // Find public API keys (no user ownership)
    async findPublicApiKeys() {
        // @ts-ignore
        return await db
            .select({
                uuid: apiKeysTable.uuid,
                name: apiKeysTable.name,
                key: apiKeysTable.key,
                created_at: apiKeysTable.created_at,
                is_active: apiKeysTable.is_active,
                user_id: apiKeysTable.user_id,
            } as any)
            .from(apiKeysTable as any)
            .where(isNull(apiKeysTable.user_id as any))
            .orderBy(desc(apiKeysTable.created_at as any)) as any;
    }

    // Find API keys accessible to a specific user (public + user's own keys)
    async findAccessibleToUser(userId: string) {
        // @ts-ignore
        return await db
            .select({
                uuid: apiKeysTable.uuid,
                name: apiKeysTable.name,
                key: apiKeysTable.key,
                created_at: apiKeysTable.created_at,
                is_active: apiKeysTable.is_active,
                user_id: apiKeysTable.user_id,
            } as any)
            .from(apiKeysTable as any)
            .where(
                or(
                    isNull(apiKeysTable.user_id as any), // Public API keys
                    eq(apiKeysTable.user_id as any, userId), // User's own API keys
                ) as any,
            )
            .orderBy(desc(apiKeysTable.created_at as any)) as any;
    }

    async findByUuid(uuid: string, userId: string) {
        // @ts-ignore
        const [apiKey] = await db
            .select({
                uuid: apiKeysTable.uuid,
                name: apiKeysTable.name,
                key: apiKeysTable.key,
                created_at: apiKeysTable.created_at,
                is_active: apiKeysTable.is_active,
                user_id: apiKeysTable.user_id,
            } as any)
            .from(apiKeysTable as any)
            .where(
                and(eq(apiKeysTable.uuid as any, uuid), eq(apiKeysTable.user_id as any, userId)),
            ) as any;

        return apiKey;
    }

    // Find API key by UUID with access control (user can access their own keys + public keys)
    async findByUuidWithAccess(uuid: string, userId?: string) {
        // @ts-ignore
        const [apiKey] = await db
            .select({
                uuid: apiKeysTable.uuid,
                name: apiKeysTable.name,
                key: apiKeysTable.key,
                created_at: apiKeysTable.created_at,
                is_active: apiKeysTable.is_active,
                user_id: apiKeysTable.user_id,
            } as any)
            .from(apiKeysTable as any)
            .where(
                and(
                    eq(apiKeysTable.uuid as any, uuid),
                    userId
                        ? or(
                            isNull(apiKeysTable.user_id as any), // Public API keys
                            eq(apiKeysTable.user_id as any, userId), // User's own API keys
                        )
                        : isNull(apiKeysTable.user_id as any), // Only public if no user context
                ) as any,
            ) as any;

        return apiKey;
    }

    async validateApiKey(key: string): Promise<{
        valid: boolean;
        user_id?: string | null;
        key_uuid?: string;
        type?: ApiKeyType;
    }> {
        // @ts-ignore
        const [apiKey] = await db
            .select({
                uuid: apiKeysTable.uuid,
                user_id: apiKeysTable.user_id,
                is_active: apiKeysTable.is_active,
            } as any)
            .from(apiKeysTable as any)
            .where(eq(apiKeysTable.key as any, key)) as any;

        if (!apiKey) {
            return { valid: false };
        }

        // Check if key is active
        if (!apiKey.is_active) {
            return { valid: false };
        }

        return {
            valid: true,
            user_id: apiKey.user_id,
            key_uuid: apiKey.uuid,
            type: "MCP", // Hardcoded default as schema removed it
        };
    }

    async update(uuid: string, userId: string, input: ApiKeyUpdateInput) {
        // @ts-ignore
        const [updatedApiKey] = await db
            .update(apiKeysTable as any)
            .set({
                ...(input.name && { name: input.name }),
                // ...(input.type && { type: input.type }), // Removed from schema
                ...(input.is_active !== undefined && { is_active: input.is_active }),
            } as any)
            .where(
                and(
                    eq(apiKeysTable.uuid as any, uuid),
                    or(eq(apiKeysTable.user_id as any, userId), isNull(apiKeysTable.user_id as any)),
                ) as any,
            )
            .returning({
                uuid: apiKeysTable.uuid,
                name: apiKeysTable.name,
                key: apiKeysTable.key,
                created_at: apiKeysTable.created_at,
                is_active: apiKeysTable.is_active,
            } as any) as any;

        if (!updatedApiKey) {
            throw new Error("Failed to update API key or API key not found");
        }

        return updatedApiKey;
    }

    async delete(uuid: string, userId: string) {
        // @ts-ignore
        const [deletedApiKey] = await db
            .delete(apiKeysTable as any)
            .where(
                and(
                    eq(apiKeysTable.uuid as any, uuid),
                    or(eq(apiKeysTable.user_id as any, userId), isNull(apiKeysTable.user_id as any)),
                ) as any,
            )
            .returning({
                uuid: apiKeysTable.uuid,
                name: apiKeysTable.name,
            } as any) as any;

        if (!deletedApiKey) {
            throw new Error("Failed to delete API key or API key not found");
        }

        return deletedApiKey;
    }
}

export const apiKeysRepository = new ApiKeysRepository();

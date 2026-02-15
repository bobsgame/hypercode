// @ts-nocheck
/**
 * @file namespaces.repo.ts
 * @module packages/core/src/db/repositories/namespaces.repo
 *
 * WHAT:
 * Repository for managing Namespaces.
 *
 * WHY:
 * Handles logical grouping of MCP servers/tools.
 * Manages mappings between Namespaces, Servers, and Tools.
 *
 * HOW:
 * - Uses transaction-like logic (sequential inserts) to create namespaces and mappings.
 * - Imports `namespaceMappingsRepository` for sub-operations.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
    DatabaseNamespace,
    DatabaseNamespaceTool,
    DatabaseNamespaceWithServers,
    NamespaceCreateInput,
    NamespaceUpdateInput,
} from "../../types/metamcp/index.js";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";

import { db } from "../index.js";
import {
    mcpServersTable,
    namespaceServerMappingsTable,
    namespacesTable,
    namespaceToolMappingsTable,
    toolsTable,
} from "../metamcp-schema.js";
import { randomUUID } from "node:crypto";
import { namespaceMappingsRepository } from "./namespace-mappings.repo.js";

export class NamespacesRepository {
    async create(input: NamespaceCreateInput): Promise<DatabaseNamespace> {
        // @ts-ignore
        const [createdNamespace] = await db
            .insert(namespacesTable as any)
            .values({
                ...input,
                uuid: randomUUID(),
            } as any)
            .returning() as any;

        if (!createdNamespace) {
            throw new Error("Failed to create namespace");
        }
        // If mcp server UUIDs are provided, create the mappings with default ACTIVE status
        if (input.mcpServerUuids && input.mcpServerUuids.length > 0) {
            const mappings = input.mcpServerUuids.map((serverUuid) => ({
                namespace_uuid: createdNamespace.uuid,
                mcp_server_uuid: serverUuid,
                status: "ACTIVE" as const,
            }));

            // @ts-ignore
            await db.insert(namespaceServerMappingsTable as any).values(mappings as any);

            // Also create namespace-tool mappings for all tools of the selected servers
            // @ts-ignore
            const serverTools = await db
                .select({
                    uuid: toolsTable.uuid,
                    mcp_server_uuid: toolsTable.mcp_server_uuid,
                } as any)
                .from(toolsTable as any)
                .where(inArray(toolsTable.mcp_server_uuid as any, input.mcpServerUuids) as any) as any;

            if (serverTools.length > 0) {
                const toolMappings = serverTools.map((tool: any) => ({
                    namespace_uuid: createdNamespace.uuid,
                    tool_uuid: tool.uuid,
                    mcp_server_uuid: tool.mcp_server_uuid,
                    status: "ACTIVE" as const,
                }));

                // @ts-ignore
                await db.insert(namespaceToolMappingsTable as any).values(toolMappings as any);
            }
        }

        return createdNamespace;
    }

    async findAll(): Promise<DatabaseNamespace[]> {
        // @ts-ignore
        return await db
            .select({
                uuid: namespacesTable.uuid,
                name: namespacesTable.name,
                description: namespacesTable.description,
                created_at: namespacesTable.created_at,
                updated_at: namespacesTable.updated_at,
                user_id: namespacesTable.user_id,
            } as any)
            .from(namespacesTable as any)
            .orderBy(desc(namespacesTable.created_at as any)) as any;
    }

    // Find namespaces accessible to a specific user (public + user's own namespaces)
    async findAllAccessibleToUser(userId: string): Promise<DatabaseNamespace[]> {
        // @ts-ignore
        return await db
            .select({
                uuid: namespacesTable.uuid,
                name: namespacesTable.name,
                description: namespacesTable.description,
                created_at: namespacesTable.created_at,
                updated_at: namespacesTable.updated_at,
                user_id: namespacesTable.user_id,
            } as any)
            .from(namespacesTable as any)
            .where(
                or(
                    isNull(namespacesTable.user_id as any), // Public namespaces
                    eq(namespacesTable.user_id as any, userId), // User's own namespaces
                ) as any,
            )
            .orderBy(desc(namespacesTable.created_at as any)) as any;
    }

    // Find only public namespaces (no user ownership)
    async findPublicNamespaces(): Promise<DatabaseNamespace[]> {
        // @ts-ignore
        return await db
            .select({
                uuid: namespacesTable.uuid,
                name: namespacesTable.name,
                description: namespacesTable.description,
                created_at: namespacesTable.created_at,
                updated_at: namespacesTable.updated_at,
                user_id: namespacesTable.user_id,
            } as any)
            .from(namespacesTable as any)
            .where(isNull(namespacesTable.user_id as any))
            .orderBy(desc(namespacesTable.created_at as any)) as any;
    }

    // Find namespaces owned by a specific user
    async findByUserId(userId: string): Promise<DatabaseNamespace[]> {
        // @ts-ignore
        return await db
            .select({
                uuid: namespacesTable.uuid,
                name: namespacesTable.name,
                description: namespacesTable.description,
                created_at: namespacesTable.created_at,
                updated_at: namespacesTable.updated_at,
                user_id: namespacesTable.user_id,
            } as any)
            .from(namespacesTable as any)
            .where(eq(namespacesTable.user_id as any, userId))
            .orderBy(desc(namespacesTable.created_at as any)) as any;
    }

    async findByUuid(uuid: string): Promise<DatabaseNamespace | undefined> {
        // @ts-ignore
        const [namespace] = await db
            .select({
                uuid: namespacesTable.uuid,
                name: namespacesTable.name,
                description: namespacesTable.description,
                created_at: namespacesTable.created_at,
                updated_at: namespacesTable.updated_at,
                user_id: namespacesTable.user_id,
            } as any)
            .from(namespacesTable as any)
            .where(eq(namespacesTable.uuid as any, uuid));

        return namespace;
    }

    // Find namespace by name within user scope (for uniqueness checks)
    async findByNameAndUserId(
        name: string,
        userId: string | null,
    ): Promise<DatabaseNamespace | undefined> {
        // @ts-ignore
        const [namespace] = await db
            .select({
                uuid: namespacesTable.uuid,
                name: namespacesTable.name,
                description: namespacesTable.description,
                created_at: namespacesTable.created_at,
                updated_at: namespacesTable.updated_at,
                user_id: namespacesTable.user_id,
            } as any)
            .from(namespacesTable as any)
            .where(
                and(
                    eq(namespacesTable.name as any, name),
                    userId
                        ? eq(namespacesTable.user_id as any, userId)
                        : isNull(namespacesTable.user_id as any),
                ) as any,
            )
            .limit(1) as any;

        return namespace;
    }

    async findByUuidWithServers(
        uuid: string,
    ): Promise<DatabaseNamespaceWithServers | null> {
        // First, get the namespace
        const namespace = await this.findByUuid(uuid);

        if (!namespace) {
            return null;
        }

        // Then, get servers associated with this namespace
        // @ts-ignore
        const serversData = await db
            .select({
                uuid: mcpServersTable.uuid,
                name: mcpServersTable.name,
                description: mcpServersTable.description,
                type: mcpServersTable.type,
                command: mcpServersTable.command,
                args: mcpServersTable.args,
                url: mcpServersTable.url,
                env: mcpServersTable.env,
                bearerToken: mcpServersTable.bearerToken,
                headers: mcpServersTable.headers,
                error_status: mcpServersTable.error_status,
                created_at: mcpServersTable.created_at,
                user_id: mcpServersTable.user_id,
                status: namespaceServerMappingsTable.status,
            } as any)
            .from(mcpServersTable as any)
            .innerJoin(
                namespaceServerMappingsTable as any,
                eq(mcpServersTable.uuid as any, namespaceServerMappingsTable.mcp_server_uuid as any),
            )
            .where(eq(namespaceServerMappingsTable.namespace_uuid as any, uuid)) as any;

        // Format the servers without date conversion
        const servers = serversData.map((server: any) => ({
            uuid: server.uuid,
            name: server.name,
            description: server.description,
            type: server.type,
            command: server.command,
            args: server.args || [],
            url: server.url,
            env: server.env || {},
            bearerToken: server.bearerToken,
            headers: server.headers || {},
            error_status: server.error_status,
            created_at: server.created_at,
            user_id: server.user_id,
            status: server.status,
        }));

        // @ts-ignore - casting for now to match DatabaseNamespaceWithServers which expects date objects in strict mode
        // but Drizzle/SQLite might return strings depending on driver config.
        // We are using `timestamp` mode "number" or "string" in SQLite schema.
        return {
            ...namespace,
            servers,
        } as unknown as DatabaseNamespaceWithServers;
    }

    async findToolsByNamespaceUuid(
        namespaceUuid: string,
    ): Promise<DatabaseNamespaceTool[]> {
        // @ts-ignore
        const toolsData = await db
            .select({
                // Tool fields
                uuid: toolsTable.uuid,
                name: toolsTable.name,
                description: toolsTable.description,
                toolSchema: toolsTable.toolSchema,
                created_at: toolsTable.created_at,
                updated_at: toolsTable.updated_at,
                mcp_server_uuid: toolsTable.mcp_server_uuid,
                // Server fields
                serverName: mcpServersTable.name,
                serverUuid: mcpServersTable.uuid,
                // Namespace mapping fields
                status: namespaceToolMappingsTable.status,
                overrideName: namespaceToolMappingsTable.override_name,
                overrideTitle: namespaceToolMappingsTable.override_title,
                overrideDescription: namespaceToolMappingsTable.override_description,
                overrideAnnotations: namespaceToolMappingsTable.override_annotations,
            } as any)
            .from(toolsTable as any)
            .innerJoin(
                namespaceToolMappingsTable as any,
                eq(toolsTable.uuid as any, namespaceToolMappingsTable.tool_uuid as any),
            )
            .innerJoin(
                mcpServersTable as any,
                eq(toolsTable.mcp_server_uuid as any, mcpServersTable.uuid as any),
            )
            .where(eq(namespaceToolMappingsTable.namespace_uuid as any, namespaceUuid))
            .orderBy(desc(toolsTable.created_at as any)) as any;

        return toolsData;
    }

    async deleteByUuid(uuid: string): Promise<DatabaseNamespace | undefined> {
        // @ts-ignore
        const [deletedNamespace] = await db
            .delete(namespacesTable as any)
            .where(eq(namespacesTable.uuid as any, uuid))
            .returning() as any;

        return deletedNamespace;
    }

    async update(input: NamespaceUpdateInput): Promise<DatabaseNamespace> {
        // Update the namespace
        // @ts-ignore
        const [updatedNamespace] = await db
            .update(namespacesTable as any)
            .set({
                name: input.name,
                description: input.description,
                user_id: input.user_id,
                updated_at: new Date(),
            } as any)
            .where(eq(namespacesTable.uuid as any, input.uuid))
            .returning() as any;

        if (!updatedNamespace) {
            throw new Error("Namespace not found");
        }

        // If mcpServerUuids are provided, update the mappings
        if (input.mcpServerUuids) {
            // Get existing tool mappings to preserve their status
            const existingToolMappings =
                await namespaceMappingsRepository.findToolMappingsByNamespace(
                    input.uuid,
                );
            const existingToolStatusMap = new Map<string, "ACTIVE" | "INACTIVE">();

            // Create a map of existing tool statuses by tool_uuid
            existingToolMappings.forEach((mapping: any) => {
                existingToolStatusMap.set(mapping.tool_uuid, mapping.status);
            });

            // Delete existing server mappings
            // @ts-ignore
            await db
                .delete(namespaceServerMappingsTable as any)
                .where(eq(namespaceServerMappingsTable.namespace_uuid as any, input.uuid));

            // Delete existing tool mappings
            // @ts-ignore
            await db
                .delete(namespaceToolMappingsTable as any)
                .where(eq(namespaceToolMappingsTable.namespace_uuid as any, input.uuid));

            // Create new server mappings if any servers are specified
            if (input.mcpServerUuids.length > 0) {
                const serverMappings = input.mcpServerUuids.map((serverUuid) => ({
                    namespace_uuid: input.uuid,
                    mcp_server_uuid: serverUuid,
                    status: "ACTIVE" as const,
                }));

                // @ts-ignore
                await db.insert(namespaceServerMappingsTable as any).values(serverMappings as any);

                // Also create namespace-tool mappings for all tools of the selected servers
                // @ts-ignore
                const serverTools = await db
                    .select({
                        uuid: toolsTable.uuid,
                        mcp_server_uuid: toolsTable.mcp_server_uuid,
                    } as any)
                    .from(toolsTable as any)
                    .where(inArray(toolsTable.mcp_server_uuid as any, input.mcpServerUuids) as any) as any;

                if (serverTools.length > 0) {
                    const toolMappings = serverTools.map((tool: any) => ({
                        namespace_uuid: input.uuid,
                        tool_uuid: tool.uuid,
                        mcp_server_uuid: tool.mcp_server_uuid,
                        // Preserve existing status if tool was previously mapped, otherwise default to ACTIVE
                        status:
                            existingToolStatusMap.get(tool.uuid) || ("ACTIVE" as const),
                    }));

                    // @ts-ignore
                    await db.insert(namespaceToolMappingsTable as any).values(toolMappings as any);
                }
            }
        }
        return updatedNamespace;
    }
}

export const namespacesRepository = new NamespacesRepository();

/**
 * @file namespace-mappings.repo.ts
 * @module packages/core/src/db/repositories/namespace-mappings.repo
 *
 * WHAT:
 * Repository for Namespace Mappings.
 *
 * WHY:
 * Helper repository for updating statuses and overrides in many-to-many link tables.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
    NamespaceServerStatusUpdate,
    NamespaceToolOverridesUpdate,
    NamespaceToolStatusUpdate,
} from "../../types/metamcp/index.js";
import { and, eq, sql } from "drizzle-orm";

import { db } from "../index.js";
import {
    namespaceServerMappingsTable,
    namespaceToolMappingsTable,
} from "../metamcp-schema.js";

export class NamespaceMappingsRepository {
    async updateServerStatus(input: NamespaceServerStatusUpdate) {
        // @ts-ignore
        const [updatedMapping] = await db
            .update(namespaceServerMappingsTable as any)
            .set({
                status: input.status,
            } as any)
            .where(
                and(
                    eq(namespaceServerMappingsTable.namespace_uuid as any, input.namespaceUuid),
                    eq(namespaceServerMappingsTable.mcp_server_uuid as any, input.serverUuid),
                ) as any,
            )
            .returning() as any;

        return updatedMapping;
    }

    async updateToolStatus(input: NamespaceToolStatusUpdate) {
        // @ts-ignore
        const [updatedMapping] = await db
            .update(namespaceToolMappingsTable as any)
            .set({
                status: input.status,
            } as any)
            .where(
                and(
                    eq(namespaceToolMappingsTable.namespace_uuid as any, input.namespaceUuid),
                    eq(namespaceToolMappingsTable.tool_uuid as any, input.toolUuid),
                    eq(namespaceToolMappingsTable.mcp_server_uuid as any, input.serverUuid),
                ) as any,
            )
            .returning() as any;

        return updatedMapping;
    }

    async updateToolOverrides(input: NamespaceToolOverridesUpdate) {
        // @ts-ignore
        const [updatedMapping] = await db
            .update(namespaceToolMappingsTable as any)
            .set({
                override_name: input.overrideName,
                override_title: input.overrideTitle,
                override_description: input.overrideDescription,
                override_annotations: input.overrideAnnotations,
            } as any)
            .where(
                and(
                    eq(namespaceToolMappingsTable.namespace_uuid as any, input.namespaceUuid),
                    eq(namespaceToolMappingsTable.tool_uuid as any, input.toolUuid),
                    eq(namespaceToolMappingsTable.mcp_server_uuid as any, input.serverUuid),
                ) as any,
            )
            .returning() as any;

        return updatedMapping;
    }

    async findServerMapping(namespaceUuid: string, serverUuid: string) {
        // @ts-ignore
        const [mapping] = await db
            .select()
            .from(namespaceServerMappingsTable as any)
            .where(
                and(
                    eq(namespaceServerMappingsTable.namespace_uuid as any, namespaceUuid),
                    eq(namespaceServerMappingsTable.mcp_server_uuid as any, serverUuid),
                ) as any,
            ) as any;

        return mapping;
    }

    /**
     * Find all namespace UUIDs that use a specific MCP server
     */
    async findNamespacesByServerUuid(serverUuid: string): Promise<string[]> {
        // @ts-ignore
        const mappings = await db
            .select({
                namespace_uuid: namespaceServerMappingsTable.namespace_uuid,
            } as any)
            .from(namespaceServerMappingsTable as any)
            .where(eq(namespaceServerMappingsTable.mcp_server_uuid as any, serverUuid)) as any;

        return mappings.map((mapping: any) => mapping.namespace_uuid);
    }

    /**
     * Get all existing tool mappings for a namespace
     */
    async findToolMappingsByNamespace(namespaceUuid: string) {
        // @ts-ignore
        const mappings = await db
            .select()
            .from(namespaceToolMappingsTable as any)
            .where(eq(namespaceToolMappingsTable.namespace_uuid as any, namespaceUuid)) as any;

        return mappings;
    }

    async findToolMapping(
        namespaceUuid: string,
        toolUuid: string,
        serverUuid: string,
    ) {
        // @ts-ignore
        const [mapping] = await db
            .select()
            .from(namespaceToolMappingsTable as any)
            .where(
                and(
                    eq(namespaceToolMappingsTable.namespace_uuid as any, namespaceUuid),
                    eq(namespaceToolMappingsTable.tool_uuid as any, toolUuid),
                    eq(namespaceToolMappingsTable.mcp_server_uuid as any, serverUuid),
                ) as any,
            ) as any;

        return mapping;
    }

    /**
     * Bulk upsert namespace tool mappings for a namespace
     * Used when refreshing tools from MetaMCP connection
     */
    async bulkUpsertNamespaceToolMappings(input: {
        namespaceUuid: string;
        toolMappings: Array<{
            toolUuid: string;
            serverUuid: string;
            status?: "ACTIVE" | "INACTIVE";
        }>;
    }) {
        if (!input.toolMappings || input.toolMappings.length === 0) {
            return [];
        }

        const mappingsToInsert = input.toolMappings.map((mapping) => ({
            namespace_uuid: input.namespaceUuid,
            tool_uuid: mapping.toolUuid,
            mcp_server_uuid: mapping.serverUuid,
            status: (mapping.status || "ACTIVE") as "ACTIVE" | "INACTIVE",
        }));

        // Upsert the mappings - if they exist, update the status; if not, insert them
        // @ts-ignore
        return await db
            .insert(namespaceToolMappingsTable as any)
            .values(mappingsToInsert as any)
            .onConflictDoUpdate({
                target: [
                    namespaceToolMappingsTable.namespace_uuid,
                    namespaceToolMappingsTable.tool_uuid,
                ],
                set: {
                    status: sql`excluded.status`,
                    mcp_server_uuid: sql`excluded.mcp_server_uuid`,
                },
            } as any)
            .returning() as any;
    }
}

export const namespaceMappingsRepository = new NamespaceMappingsRepository();

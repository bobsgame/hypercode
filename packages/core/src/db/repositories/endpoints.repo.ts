// @ts-nocheck
/**
 * @file endpoints.repo.ts
 * @module packages/core/src/db/repositories/endpoints.repo
 *
 * WHAT:
 * Repository for managing MCP Endpoints (Gateways).
 *
 * WHY:
 * Handles CRUD for Endpoints, including user access control and namespace linking.
 *
 * HOW:
 * - Links to `db/metamcp-schema`.
 * - Joins with `namespacesTable` for rich data.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
    DatabaseEndpoint,
    DatabaseEndpointWithNamespace,
    EndpointCreateInput,
    EndpointUpdateInput,
} from "../../types/metamcp/index.js";
import { and, desc, eq, isNull, or } from "drizzle-orm";

import { db } from "../index.js";
import { endpointsTable, namespacesTable } from "../metamcp-schema.js";
// import { randomUUID } from "node:crypto"; // Unused?

export class EndpointsRepository {
    async create(input: EndpointCreateInput): Promise<DatabaseEndpoint> {
        // @ts-ignore
        const [endpoint] = await db
            .insert(endpointsTable as any)
            .values({
                client_max_rate: input.client_max_rate,
                max_rate_seconds: input.max_rate_seconds,
                client_max_rate_seconds: input.client_max_rate_seconds,
                client_max_rate_strategy: input.client_max_rate_strategy,
                client_max_rate_strategy_key: input.client_max_rate_strategy_key,
                enable_oauth: input.enable_oauth ?? false,
                use_query_param_auth: input.use_query_param_auth ?? false,
                user_id: input.user_id,
            } as any)
            .returning() as any;

        if (!endpoint) {
            throw new Error("Failed to create endpoint");
        }

        return endpoint;
    }

    async findAll(): Promise<DatabaseEndpoint[]> {
        // @ts-ignore
        return await db
            .select({
                uuid: endpointsTable.uuid,
                name: endpointsTable.name,
                description: endpointsTable.description,
                namespace_uuid: endpointsTable.namespace_uuid,
                enable_api_key_auth: endpointsTable.enable_api_key_auth,
                enable_oauth: endpointsTable.enable_oauth,
                enable_max_rate: endpointsTable.enable_max_rate,
                enable_client_max_rate: endpointsTable.enable_client_max_rate,
                max_rate: endpointsTable.max_rate,
                client_max_rate: endpointsTable.client_max_rate,
                max_rate_seconds: endpointsTable.max_rate_seconds,
                client_max_rate_seconds: endpointsTable.client_max_rate_seconds,
                client_max_rate_strategy: endpointsTable.client_max_rate_strategy,
                client_max_rate_strategy_key:
                    endpointsTable.client_max_rate_strategy_key,
                use_query_param_auth: endpointsTable.use_query_param_auth,
                created_at: endpointsTable.created_at,
                updated_at: endpointsTable.updated_at,
                user_id: endpointsTable.user_id,
            } as any)
            .from(endpointsTable as any)
            .orderBy(desc(endpointsTable.created_at as any)) as any;
    }

    // Find endpoints accessible to a specific user (public + user's own endpoints)
    async findAllAccessibleToUser(userId: string): Promise<DatabaseEndpoint[]> {
        // @ts-ignore
        return await db
            .select({
                uuid: endpointsTable.uuid,
                name: endpointsTable.name,
                description: endpointsTable.description,
                namespace_uuid: endpointsTable.namespace_uuid,
                enable_api_key_auth: endpointsTable.enable_api_key_auth,
                enable_oauth: endpointsTable.enable_oauth,
                enable_max_rate: endpointsTable.enable_max_rate,
                enable_client_max_rate: endpointsTable.enable_client_max_rate,
                max_rate: endpointsTable.max_rate,
                client_max_rate: endpointsTable.client_max_rate,
                max_rate_seconds: endpointsTable.max_rate_seconds,
                client_max_rate_seconds: endpointsTable.client_max_rate_seconds,
                client_max_rate_strategy: endpointsTable.client_max_rate_strategy,
                client_max_rate_strategy_key:
                    endpointsTable.client_max_rate_strategy_key,
                use_query_param_auth: endpointsTable.use_query_param_auth,
                created_at: endpointsTable.created_at,
                updated_at: endpointsTable.updated_at,
                user_id: endpointsTable.user_id,
            } as any)
            .from(endpointsTable as any)
            .where(
                or(
                    isNull(endpointsTable.user_id as any), // Public endpoints
                    eq(endpointsTable.user_id as any, userId), // User's own endpoints
                ) as any,
            )
            .orderBy(desc(endpointsTable.created_at as any)) as any;
    }

    // Find endpoints accessible to a specific user with namespace data (public + user's own endpoints)
    async findAllAccessibleToUserWithNamespaces(
        userId: string,
    ): Promise<DatabaseEndpointWithNamespace[]> {
        // @ts-ignore
        const endpointsData = await db
            .select({
                // Endpoint fields
                uuid: endpointsTable.uuid,
                name: endpointsTable.name,
                description: endpointsTable.description,
                namespace_uuid: endpointsTable.namespace_uuid,
                enable_api_key_auth: endpointsTable.enable_api_key_auth,
                enable_oauth: endpointsTable.enable_oauth,
                enable_max_rate: endpointsTable.enable_max_rate,
                enable_client_max_rate: endpointsTable.enable_client_max_rate,
                max_rate: endpointsTable.max_rate,
                client_max_rate: endpointsTable.client_max_rate,
                max_rate_seconds: endpointsTable.max_rate_seconds,
                client_max_rate_seconds: endpointsTable.client_max_rate_seconds,
                client_max_rate_strategy: endpointsTable.client_max_rate_strategy,
                client_max_rate_strategy_key:
                    endpointsTable.client_max_rate_strategy_key,
                use_query_param_auth: endpointsTable.use_query_param_auth,
                created_at: endpointsTable.created_at,
                updated_at: endpointsTable.updated_at,
                user_id: endpointsTable.user_id,
                // Namespace fields
                namespace: {
                    uuid: namespacesTable.uuid,
                    name: namespacesTable.name,
                    description: namespacesTable.description,
                    created_at: namespacesTable.created_at,
                    updated_at: namespacesTable.updated_at,
                    user_id: namespacesTable.user_id,
                },
            } as any)
            .from(endpointsTable as any)
            .innerJoin(
                namespacesTable as any,
                eq(endpointsTable.namespace_uuid as any, namespacesTable.uuid as any),
            )
            .where(
                or(
                    isNull(endpointsTable.user_id as any), // Public endpoints
                    eq(endpointsTable.user_id as any, userId), // User's own endpoints
                ) as any,
            )
            .orderBy(desc(endpointsTable.created_at as any)) as any;

        // Force cast to match helper type which expects Namespace object
        return endpointsData as unknown as DatabaseEndpointWithNamespace[];
    }

    // Find only public endpoints (no user ownership)
    async findPublicEndpoints(): Promise<DatabaseEndpoint[]> {
        // @ts-ignore
        return await db
            .select({
                uuid: endpointsTable.uuid,
                name: endpointsTable.name,
                description: endpointsTable.description,
                namespace_uuid: endpointsTable.namespace_uuid,
                enable_api_key_auth: endpointsTable.enable_api_key_auth,
                enable_oauth: endpointsTable.enable_oauth,
                enable_max_rate: endpointsTable.enable_max_rate,
                enable_client_max_rate: endpointsTable.enable_client_max_rate,
                max_rate: endpointsTable.max_rate,
                client_max_rate: endpointsTable.client_max_rate,
                max_rate_seconds: endpointsTable.max_rate_seconds,
                client_max_rate_seconds: endpointsTable.client_max_rate_seconds,
                client_max_rate_strategy: endpointsTable.client_max_rate_strategy,
                client_max_rate_strategy_key:
                    endpointsTable.client_max_rate_strategy_key,
                use_query_param_auth: endpointsTable.use_query_param_auth,
                created_at: endpointsTable.created_at,
                updated_at: endpointsTable.updated_at,
                user_id: endpointsTable.user_id,
            } as any)
            .from(endpointsTable as any)
            .where(isNull(endpointsTable.user_id as any))
            .orderBy(desc(endpointsTable.created_at as any)) as any;
    }

    // Find endpoints owned by a specific user
    async findByUserId(userId: string): Promise<DatabaseEndpoint[]> {
        // Explicit selection for type safety
        // @ts-ignore
        return await db
            .select({
                uuid: endpointsTable.uuid,
                name: endpointsTable.name,
                description: endpointsTable.description,
                namespace_uuid: endpointsTable.namespace_uuid,
                enable_api_key_auth: endpointsTable.enable_api_key_auth,
                enable_oauth: endpointsTable.enable_oauth,
                enable_max_rate: endpointsTable.enable_max_rate,
                enable_client_max_rate: endpointsTable.enable_client_max_rate,
                max_rate: endpointsTable.max_rate,
                client_max_rate: endpointsTable.client_max_rate,
                max_rate_seconds: endpointsTable.max_rate_seconds,
                client_max_rate_seconds: endpointsTable.client_max_rate_seconds,
                client_max_rate_strategy: endpointsTable.client_max_rate_strategy,
                client_max_rate_strategy_key:
                    endpointsTable.client_max_rate_strategy_key,
                use_query_param_auth: endpointsTable.use_query_param_auth,
                created_at: endpointsTable.created_at,
                updated_at: endpointsTable.updated_at,
                user_id: endpointsTable.user_id,
            } as any)
            .from(endpointsTable as any)
            .where(eq(endpointsTable.user_id as any, userId))
            .orderBy(desc(endpointsTable.created_at as any)) as any;
    }

    async findAllWithNamespaces(): Promise<DatabaseEndpointWithNamespace[]> {
        // @ts-ignore
        const endpointsData = await db
            .select({
                // Endpoint fields
                uuid: endpointsTable.uuid,
                name: endpointsTable.name,
                description: endpointsTable.description,
                namespace_uuid: endpointsTable.namespace_uuid,
                enable_api_key_auth: endpointsTable.enable_api_key_auth,
                enable_oauth: endpointsTable.enable_oauth,
                enable_max_rate: endpointsTable.enable_max_rate,
                enable_client_max_rate: endpointsTable.enable_client_max_rate,
                max_rate: endpointsTable.max_rate,
                client_max_rate: endpointsTable.client_max_rate,
                max_rate_seconds: endpointsTable.max_rate_seconds,
                client_max_rate_seconds: endpointsTable.client_max_rate_seconds,
                client_max_rate_strategy: endpointsTable.client_max_rate_strategy,
                client_max_rate_strategy_key:
                    endpointsTable.client_max_rate_strategy_key,
                use_query_param_auth: endpointsTable.use_query_param_auth,
                created_at: endpointsTable.created_at,
                updated_at: endpointsTable.updated_at,
                user_id: endpointsTable.user_id,
                // Namespace fields
                namespace: {
                    uuid: namespacesTable.uuid,
                    name: namespacesTable.name,
                    description: namespacesTable.description,
                    created_at: namespacesTable.created_at,
                    updated_at: namespacesTable.updated_at,
                    user_id: namespacesTable.user_id,
                },
            } as any)
            .from(endpointsTable as any)
            .innerJoin(
                namespacesTable as any,
                eq(endpointsTable.namespace_uuid as any, namespacesTable.uuid as any),
            )
            .orderBy(desc(endpointsTable.created_at as any)) as any;

        return endpointsData as unknown as DatabaseEndpointWithNamespace[];
    }

    async findByUuid(uuid: string): Promise<DatabaseEndpoint | undefined> {
        // @ts-ignore
        const [endpoint] = await db
            .select({
                uuid: endpointsTable.uuid,
                name: endpointsTable.name,
                description: endpointsTable.description,
                namespace_uuid: endpointsTable.namespace_uuid,
                enable_api_key_auth: endpointsTable.enable_api_key_auth,
                enable_oauth: endpointsTable.enable_oauth,
                enable_max_rate: endpointsTable.enable_max_rate,
                enable_client_max_rate: endpointsTable.enable_client_max_rate,
                max_rate: endpointsTable.max_rate,
                client_max_rate: endpointsTable.client_max_rate,
                max_rate_seconds: endpointsTable.max_rate_seconds,
                client_max_rate_seconds: endpointsTable.client_max_rate_seconds,
                client_max_rate_strategy: endpointsTable.client_max_rate_strategy,
                client_max_rate_strategy_key:
                    endpointsTable.client_max_rate_strategy_key,
                use_query_param_auth: endpointsTable.use_query_param_auth,
                created_at: endpointsTable.created_at,
                updated_at: endpointsTable.updated_at,
                user_id: endpointsTable.user_id,
            } as any)
            .from(endpointsTable as any)
            .where(eq(endpointsTable.uuid as any, uuid));

        return endpoint;
    }

    async findByUuidWithNamespace(
        uuid: string,
    ): Promise<DatabaseEndpointWithNamespace | undefined> {
        // @ts-ignore
        const [endpointData] = await db
            .select({
                // Endpoint fields
                uuid: endpointsTable.uuid,
                name: endpointsTable.name,
                description: endpointsTable.description,
                namespace_uuid: endpointsTable.namespace_uuid,
                enable_api_key_auth: endpointsTable.enable_api_key_auth,
                enable_oauth: endpointsTable.enable_oauth,
                enable_max_rate: endpointsTable.enable_max_rate,
                enable_client_max_rate: endpointsTable.enable_client_max_rate,
                max_rate: endpointsTable.max_rate,
                client_max_rate: endpointsTable.client_max_rate,
                max_rate_seconds: endpointsTable.max_rate_seconds,
                client_max_rate_seconds: endpointsTable.client_max_rate_seconds,
                client_max_rate_strategy: endpointsTable.client_max_rate_strategy,
                client_max_rate_strategy_key:
                    endpointsTable.client_max_rate_strategy_key,
                use_query_param_auth: endpointsTable.use_query_param_auth,
                created_at: endpointsTable.created_at,
                updated_at: endpointsTable.updated_at,
                user_id: endpointsTable.user_id,
                // Namespace fields
                namespace: {
                    uuid: namespacesTable.uuid,
                    name: namespacesTable.name,
                    description: namespacesTable.description,
                    created_at: namespacesTable.created_at,
                    updated_at: namespacesTable.updated_at,
                    user_id: namespacesTable.user_id,
                },
            } as any)
            .from(endpointsTable as any)
            .innerJoin(
                namespacesTable as any,
                eq(endpointsTable.namespace_uuid as any, namespacesTable.uuid as any),
            )
            .where(eq(endpointsTable.uuid as any, uuid));

        return endpointData as unknown as DatabaseEndpointWithNamespace;
    }

    async findByName(name: string): Promise<DatabaseEndpoint | undefined> {
        // @ts-ignore
        const [endpoint] = await db
            .select({
                uuid: endpointsTable.uuid,
                name: endpointsTable.name,
                description: endpointsTable.description,
                namespace_uuid: endpointsTable.namespace_uuid,
                enable_api_key_auth: endpointsTable.enable_api_key_auth,
                enable_oauth: endpointsTable.enable_oauth,
                enable_max_rate: endpointsTable.enable_max_rate,
                enable_client_max_rate: endpointsTable.enable_client_max_rate,
                max_rate: endpointsTable.max_rate,
                client_max_rate: endpointsTable.client_max_rate,
                max_rate_seconds: endpointsTable.max_rate_seconds,
                client_max_rate_seconds: endpointsTable.client_max_rate_seconds,
                client_max_rate_strategy: endpointsTable.client_max_rate_strategy,
                client_max_rate_strategy_key:
                    endpointsTable.client_max_rate_strategy_key,
                use_query_param_auth: endpointsTable.use_query_param_auth,
                created_at: endpointsTable.created_at,
                updated_at: endpointsTable.updated_at,
                user_id: endpointsTable.user_id,
            } as any)
            .from(endpointsTable as any)
            .where(eq(endpointsTable.name as any, name));

        return endpoint;
    }

    // Find endpoint by name within user scope (for uniqueness checks)
    async findByNameAndUserId(
        name: string,
        userId: string | null,
    ): Promise<DatabaseEndpoint | undefined> {
        // @ts-ignore
        const [endpoint] = await db
            .select({
                uuid: endpointsTable.uuid,
                name: endpointsTable.name,
                description: endpointsTable.description,
                namespace_uuid: endpointsTable.namespace_uuid,
                enable_api_key_auth: endpointsTable.enable_api_key_auth,
                enable_oauth: endpointsTable.enable_oauth,
                enable_max_rate: endpointsTable.enable_max_rate,
                enable_client_max_rate: endpointsTable.enable_client_max_rate,
                max_rate: endpointsTable.max_rate,
                client_max_rate: endpointsTable.client_max_rate,
                max_rate_seconds: endpointsTable.max_rate_seconds,
                client_max_rate_seconds: endpointsTable.client_max_rate_seconds,
                client_max_rate_strategy: endpointsTable.client_max_rate_strategy,
                client_max_rate_strategy_key:
                    endpointsTable.client_max_rate_strategy_key,
                use_query_param_auth: endpointsTable.use_query_param_auth,
                created_at: endpointsTable.created_at,
                updated_at: endpointsTable.updated_at,
                user_id: endpointsTable.user_id,
            } as any)
            .from(endpointsTable as any)
            .where(
                and(
                    eq(endpointsTable.name as any, name),
                    userId
                        ? eq(endpointsTable.user_id as any, userId)
                        : isNull(endpointsTable.user_id as any),
                ) as any,
            )
            .limit(1) as any;

        return endpoint;
    }

    async deleteByUuid(uuid: string): Promise<DatabaseEndpoint | undefined> {
        // @ts-ignore
        const [deletedEndpoint] = await db
            .delete(endpointsTable as any)
            .where(eq(endpointsTable.uuid as any, uuid))
            .returning() as any;

        return deletedEndpoint;
    }

    async update(input: EndpointUpdateInput): Promise<DatabaseEndpoint> {
        // @ts-ignore
        const [updatedEndpoint] = await db
            .update(endpointsTable as any)
            .set({
                name: input.name,
                description: input.description,
                namespace_uuid: input.namespace_uuid,
                enable_api_key_auth: input.enable_api_key_auth,
                enable_oauth: input.enable_oauth,
                enable_max_rate: input.enable_max_rate,
                enable_client_max_rate: input.enable_client_max_rate,
                max_rate: input.max_rate,
                client_max_rate: input.client_max_rate,
                max_rate_seconds: input.max_rate_seconds,
                client_max_rate_seconds: input.client_max_rate_seconds,
                client_max_rate_strategy: input.client_max_rate_strategy,
                client_max_rate_strategy_key: input.client_max_rate_strategy_key,
                use_query_param_auth: input.use_query_param_auth,
                user_id: input.user_id,
                updated_at: new Date(),
            } as any)
            .where(eq(endpointsTable.uuid as any, input.uuid))
            .returning() as any;

        if (!updatedEndpoint) {
            throw new Error("Failed to update endpoint");
        }

        return updatedEndpoint;
    }
}

// Export the repository instance
export const endpointsRepository = new EndpointsRepository();

// @ts-nocheck
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../index.js";
import { policiesTable } from "../metamcp-schema.js";
import { CreatePolicySchema, UpdatePolicySchema, PolicySchema } from "../../types/metamcp/policies.zod.js";
import { z } from "zod";

export class PoliciesRepository {
    async findAll() {
        // @ts-ignore
        const policies = await db.select().from(policiesTable as any).orderBy(desc(policiesTable.created_at as any)) as any;
        return policies.map(this.mapToDomain);
    }

    async findByUuid(uuid: string) {
        // @ts-ignore
        const [policy] = await db.select().from(policiesTable as any).where(eq(policiesTable.uuid as any, uuid)) as any;
        return policy ? this.mapToDomain(policy) : undefined;
    }

    async create(input: z.infer<typeof CreatePolicySchema>) {
        // @ts-ignore
        const [policy] = await db.insert(policiesTable as any).values({
            uuid: randomUUID(),
            name: input.name,
            description: input.description,
            rules: input.rules,
        } as any).returning() as any;
        return this.mapToDomain(policy);
    }

    async update(input: z.infer<typeof UpdatePolicySchema>) {
        // @ts-ignore
        const [policy] = await db.update(policiesTable as any)
            .set({
                ...(input.name && { name: input.name }),
                ...(input.description !== undefined && { description: input.description }),
                ...(input.rules && { rules: input.rules }),
                updated_at: new Date(),
            } as any)
            .where(eq(policiesTable.uuid as any, input.uuid))
            .returning() as any;

        if (!policy) throw new Error("Policy not found");
        return this.mapToDomain(policy);
    }

    async delete(uuid: string) {
        // @ts-ignore
        await db.delete(policiesTable as any).where(eq(policiesTable.uuid as any, uuid));
    }

    private mapToDomain(dbPolicy: any) {
        return {
            uuid: dbPolicy.uuid,
            name: dbPolicy.name,
            description: dbPolicy.description,
            rules: dbPolicy.rules,
            createdAt: new Date(dbPolicy.created_at),
            updatedAt: new Date(dbPolicy.updated_at),
        };
    }
}

export const policiesRepository = new PoliciesRepository();

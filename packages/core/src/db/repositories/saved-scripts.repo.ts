// @ts-nocheck
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../index.js";
import { savedScriptsTable } from "../metamcp-schema.js";

export class SavedScriptsRepository {
    async findAll() {
        // @ts-ignore
        const scripts = await db.select().from(savedScriptsTable as any).orderBy(desc(savedScriptsTable.created_at as any)) as any;
        return scripts.map(this.mapToDomain);
    }

    async findByUuid(uuid: string) {
        // @ts-ignore
        const [script] = await db.select().from(savedScriptsTable as any).where(eq(savedScriptsTable.uuid as any, uuid)) as any;
        return script ? this.mapToDomain(script) : undefined;
    }

    async create(input: { name: string; description?: string | null; code: string; userId?: string | null }) {
        // @ts-ignore
        const [script] = await db.insert(savedScriptsTable as any).values({
            uuid: randomUUID(),
            name: input.name,
            description: input.description,
            code: input.code,
            user_id: input.userId,
        } as any).returning() as any;
        return this.mapToDomain(script);
    }

    async update(uuid: string, input: { name?: string; description?: string | null; code?: string }) {
        // @ts-ignore
        const [script] = await db.update(savedScriptsTable as any)
            .set({
                ...(input.name && { name: input.name }),
                ...(input.description !== undefined && { description: input.description }),
                ...(input.code && { code: input.code }),
                updated_at: new Date(),
            } as any)
            .where(eq(savedScriptsTable.uuid as any, uuid))
            .returning() as any;

        if (!script) throw new Error("Script not found");
        return this.mapToDomain(script);
    }

    async delete(uuid: string) {
        // @ts-ignore
        await db.delete(savedScriptsTable as any).where(eq(savedScriptsTable.uuid as any, uuid));
    }

    private mapToDomain(dbScript: any) {
        return {
            uuid: dbScript.uuid,
            name: dbScript.name,
            description: dbScript.description,
            code: dbScript.code,
            userId: dbScript.user_id,
            createdAt: new Date(dbScript.created_at),
            updatedAt: new Date(dbScript.updated_at),
        };
    }
}

export const savedScriptsRepository = new SavedScriptsRepository();

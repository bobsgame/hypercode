// @ts-nocheck
import { eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../index.js";
import { toolSetsTable, toolSetItemsTable } from "../metamcp-schema.js";
import { ToolSet } from "../../types/metamcp/tool-sets.zod.js";

export class ToolSetsRepository {
    async findAll(): Promise<ToolSet[]> {
        // @ts-ignore
        const sets = await db.select().from(toolSetsTable as any) as any;
        return Promise.all(sets.map((s: any) => this.hydrate(s)));
    }

    async findByUuid(uuid: string): Promise<ToolSet | undefined> {
        // @ts-ignore
        const [set] = await db.select().from(toolSetsTable as any).where(eq(toolSetsTable.uuid as any, uuid)) as any;
        if (!set) return undefined;
        return this.hydrate(set);
    }

    async create(input: { name: string; description?: string | null; tools: string[]; user_id?: string | null }): Promise<ToolSet> {
        const uuid = randomUUID();
        // @ts-ignore
        const [set] = await db.insert(toolSetsTable as any).values({
            uuid,
            name: input.name,
            description: input.description,
            user_id: input.user_id,
        } as any).returning() as any;

        if (input.tools && input.tools.length > 0) {
            await this.addTools(uuid, input.tools);
        }

        return this.hydrate(set);
    }

    async deleteByUuid(uuid: string): Promise<void> {
        // @ts-ignore
        await db.delete(toolSetsTable as any).where(eq(toolSetsTable.uuid as any, uuid));
    }

    private async addTools(toolSetUuid: string, toolUuids: string[]) {
        if (toolUuids.length === 0) return;
        const items = toolUuids.map(toolUuid => ({
            uuid: randomUUID(),
            tool_set_uuid: toolSetUuid,
            tool_uuid: toolUuid,
        }));
        // @ts-ignore
        await db.insert(toolSetItemsTable as any).values(items as any);
    }

    private async hydrate(set: any): Promise<ToolSet> {
        // Fetch items
        // @ts-ignore
        const items = await db.select().from(toolSetItemsTable as any).where(eq(toolSetItemsTable.tool_set_uuid as any, set.uuid)) as any;
        return {
            uuid: set.uuid,
            name: set.name,
            description: set.description,
            tools: items.map((i: any) => i.tool_uuid),
        };
    }
}

export const toolSetsRepository = new ToolSetsRepository();

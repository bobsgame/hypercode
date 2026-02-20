import { eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../index.js";
import { toolSetsTable, toolSetItemsTable } from "../metamcp-schema.js";
import { ToolSet } from "../../types/metamcp/tool-sets.zod.js";

type ToolSetRow = typeof toolSetsTable.$inferSelect;
type ToolSetInsert = typeof toolSetsTable.$inferInsert;
type ToolSetItemRow = typeof toolSetItemsTable.$inferSelect;
type ToolSetItemInsert = typeof toolSetItemsTable.$inferInsert;

export class ToolSetsRepository {
    async findAll(): Promise<ToolSet[]> {
        const sets = await db.select().from(toolSetsTable);
        return Promise.all(sets.map((s) => this.hydrate(s)));
    }

    async findByUuid(uuid: string): Promise<ToolSet | undefined> {
        const [set] = await db.select().from(toolSetsTable).where(eq(toolSetsTable.uuid, uuid));
        if (!set) return undefined;
        return this.hydrate(set);
    }

    async create(input: { name: string; description?: string | null; tools: string[]; user_id?: string | null }): Promise<ToolSet> {
        const uuid = randomUUID();
        const payload: ToolSetInsert = {
            uuid,
            name: input.name,
            description: input.description ?? null,
            user_id: input.user_id ?? null,
        };

        const [set] = await db.insert(toolSetsTable).values(payload).returning();

        if (input.tools && input.tools.length > 0) {
            await this.addTools(uuid, input.tools);
        }

        return this.hydrate(set);
    }

    async deleteByUuid(uuid: string): Promise<void> {
        await db.delete(toolSetsTable).where(eq(toolSetsTable.uuid, uuid));
    }

    private async addTools(toolSetUuid: string, toolUuids: string[]) {
        if (toolUuids.length === 0) return;
        const items: ToolSetItemInsert[] = toolUuids.map((toolUuid) => ({
            uuid: randomUUID(),
            tool_set_uuid: toolSetUuid,
            tool_uuid: toolUuid,
        }));

        await db.insert(toolSetItemsTable).values(items);
    }

    private async hydrate(set: ToolSetRow): Promise<ToolSet> {
        const items: ToolSetItemRow[] = await db
            .select()
            .from(toolSetItemsTable)
            .where(eq(toolSetItemsTable.tool_set_uuid, set.uuid));

        return {
            uuid: set.uuid,
            name: set.name,
            description: set.description,
            tools: items.map((i) => i.tool_uuid),
        };
    }
}

export const toolSetsRepository = new ToolSetsRepository();

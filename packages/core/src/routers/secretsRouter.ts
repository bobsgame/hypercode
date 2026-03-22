import { z } from 'zod';
import { t, adminProcedure } from '../lib/trpc-core.js';
import { db } from '../db/index.js';
import { workspaceSecretsTable } from '../db/mcp-admin-schema.js';
import { eq } from 'drizzle-orm';

export const secretsRouter = t.router({
    list: adminProcedure.query(async () => {
        const secrets = await db.select({
            key: workspaceSecretsTable.key,
            created_at: workspaceSecretsTable.created_at,
            updated_at: workspaceSecretsTable.updated_at
        }).from(workspaceSecretsTable);
        return secrets;
    }),

    set: adminProcedure
        .input(z.object({ key: z.string().min(1), value: z.string() }))
        .mutation(async ({ input }) => {
            const now = new Date();
            await db.insert(workspaceSecretsTable)
                .values({
                    key: input.key,
                    value: input.value,
                    created_at: now,
                    updated_at: now,
                })
                .onConflictDoUpdate({
                    target: workspaceSecretsTable.key,
                    set: {
                        value: input.value,
                        updated_at: now,
                    }
                });
            return { success: true };
        }),

    delete: adminProcedure
        .input(z.object({ key: z.string() }))
        .mutation(async ({ input }) => {
            await db.delete(workspaceSecretsTable).where(eq(workspaceSecretsTable.key, input.key));
            return { success: true };
        })
});

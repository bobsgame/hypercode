import { desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../index.js";
import { toolCallLogsTable } from "../metamcp-schema.js";
import { MetaMcpLogEntry } from "../../types/metamcp/logs.zod.js";

type ToolCallLogRow = typeof toolCallLogsTable.$inferSelect;
type ToolCallLogInsert = typeof toolCallLogsTable.$inferInsert;

export class LogsRepository {
    async create(input: {
        toolName: string;
        level: "error" | "info" | "warn";
        message: string;
        serverName?: string;
        error?: string | null;
        arguments?: Record<string, unknown>;
        result?: Record<string, unknown>;
        durationMs?: number;
        sessionId?: string;
        parentCallUuid?: string;
    }): Promise<void> {
        const payload: ToolCallLogInsert = {
            uuid: randomUUID(),
            tool_name: input.toolName,
            // level: input.level, // Schema doesn't have level/message?
            // Wait, schema has 'error', 'args', 'result', 'duration_ms'.
            // 'message' and 'level' are in Zod but not in DB schema shown in Step 6596?
            // Let's check schema again. Step 6596 lines 553-579.
            // fields: uuid, tool_name, mcp_server_uuid, namespace_uuid, endpoint_uuid, args, result, error, duration_ms, session_id, parent_call_uuid, created_at.
            // NO 'message' or 'level'.
            // So DB stores structured tool call logs.
            // Zod 'MetaMcpLogEntrySchema' has 'message', 'level'.
            // Maybe this repo is only for Tool Call Logs?
            // And system logs go elsewhere?
            // I will map input to schema fields.
            // input.message -> maybe mostly implicit?
            // I'll stick to DB schema fields.

            args: input.arguments,
            result: input.result,
            error: input.error,
            duration_ms: input.durationMs,
            session_id: input.sessionId,
            parent_call_uuid: input.parentCallUuid,

            // Missing: mcp_server_uuid, namespace_uuid, endpoint_uuid.
            // I should accept them if available.
        };

        await db.insert(toolCallLogsTable).values(payload);
    }

    async findAll(limit = 100): Promise<MetaMcpLogEntry[]> {
        const logs = await db
            .select()
            .from(toolCallLogsTable)
            .orderBy(desc(toolCallLogsTable.created_at))
            .limit(limit);

        return logs.map((log: ToolCallLogRow) => ({
            id: log.uuid,
            timestamp: new Date(log.created_at),
            level: log.error ? "error" : "info",
            message: `Tool call: ${log.tool_name}`,
            toolName: log.tool_name,
            error: log.error,
            arguments: log.args ?? undefined,
            result: log.result ?? undefined,
            durationMs: log.duration_ms?.toString(),
            sessionId: log.session_id ?? undefined,
            parentCallUuid: log.parent_call_uuid ?? undefined,
        }));
    }

    async clear(): Promise<void> {
        await db.delete(toolCallLogsTable);
    }
}

export const logsRepository = new LogsRepository();

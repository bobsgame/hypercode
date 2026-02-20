import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { db } from "../../db/index.js";
import { toolCallLogsTable } from "../../db/metamcp-schema.js";
import { CallToolMiddleware } from "./functional-middleware.js";
import { randomUUID } from "node:crypto";

export function createLoggingMiddleware(options?: {
    enabled?: boolean;
}): CallToolMiddleware {
    const enabled = options?.enabled ?? true;

    return (next) => async (request, context) => {
        if (!enabled) {
            return next(request, context);
        }

        const startTime = Date.now();
        let result: CallToolResult | null = null;
        let error: unknown = null;

        // Check for parent call ID in _meta (passed from run_code recursion)
        const paramsWithMeta = request.params as typeof request.params & {
            _meta?: { parentCallUuid?: string };
        };
        const parentCallUuid = paramsWithMeta._meta?.parentCallUuid;

        try {
            result = await next(request, context);
            return result;
        } catch (e) {
            error = e;
            throw e;
        } finally {
            const duration = Date.now() - startTime;

            // Log to DB asynchronously
            db.insert(toolCallLogsTable).values({
                uuid: randomUUID(),
                session_id: context.sessionId,
                tool_name: request.params.name,
                args: (request.params.arguments as Record<string, unknown> | undefined) ?? null,
                result: (result as Record<string, unknown> | null) ?? null,
                error: error ? String(error) : null,
                duration_ms: duration,
                parent_call_uuid: parentCallUuid,
            }).catch((err) => {
                console.error("Failed to persist tool call log:", err);
            });
        }
    };
}

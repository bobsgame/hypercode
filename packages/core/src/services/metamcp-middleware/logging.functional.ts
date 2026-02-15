// @ts-nocheck
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { db } from "../../db/index.js";
import { toolCallLogsTable } from "../../db/schema.js";
import { CallToolMiddleware } from "./functional-middleware.js";

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
        let error: any = null;

        // Check for parent call ID in _meta (passed from run_code recursion)
        // @ts-ignore - _meta is not in CallToolRequest params type officially but we use it
        const parentCallUuid = request.params._meta?.parentCallUuid as string | undefined;

        try {
            result = await next(request, context);
            return result;
        } catch (e) {
            error = e;
            throw e;
        } finally {
            const duration = Date.now() - startTime;

            // Log to DB asynchronously
            // Forced cast to any to bypass TS overloading errors
            db.insert(toolCallLogsTable).values({
                session_id: context.sessionId,
                tool_name: request.params.name,
                arguments: request.params.arguments as Record<string, unknown>,
                result: result as unknown as Record<string, unknown>, // Casting for JSONB compatibility
                error: error ? String(error) : null,
                duration_ms: String(duration),
                parent_call_uuid: parentCallUuid,
            } as any).catch(err => {
                console.error("Failed to persist tool call log:", err);
            });
        }
    };
}

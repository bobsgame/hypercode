import crypto from 'crypto';

import { sqliteInstance } from '../db/index.js';

export type ImportedSessionMemoryKind = 'memory' | 'instruction';
export type ImportedSessionMemorySource = 'llm' | 'heuristic';

export interface ImportedSessionMemoryInput {
    kind: ImportedSessionMemoryKind;
    content: string;
    tags: string[];
    source: ImportedSessionMemorySource;
    metadata?: Record<string, unknown>;
}

export interface ImportedSessionRecordInput {
    sourceTool: string;
    sourcePath: string;
    externalSessionId?: string | null;
    title?: string | null;
    sessionFormat: string;
    transcript: string;
    excerpt?: string | null;
    workingDirectory?: string | null;
    transcriptHash: string;
    normalizedSession: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    discoveredAt: number;
    importedAt: number;
    lastModifiedAt?: number | null;
    parsedMemories: ImportedSessionMemoryInput[];
}

export interface ImportedSessionMemoryRecord extends ImportedSessionMemoryInput {
    id: string;
    importedSessionId: string;
    createdAt: number;
}

export interface ImportedSessionRecord {
    id: string;
    sourceTool: string;
    sourcePath: string;
    externalSessionId: string | null;
    title: string | null;
    sessionFormat: string;
    transcript: string;
    excerpt: string | null;
    workingDirectory: string | null;
    transcriptHash: string;
    normalizedSession: Record<string, unknown>;
    metadata: Record<string, unknown>;
    discoveredAt: number;
    importedAt: number;
    lastModifiedAt: number | null;
    createdAt: number;
    updatedAt: number;
    parsedMemories: ImportedSessionMemoryRecord[];
}

function safeJsonParse<T>(value: unknown, fallback: T): T {
    if (typeof value !== 'string' || !value.trim()) {
        return fallback;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

function mapMemoryRow(row: Record<string, unknown>): ImportedSessionMemoryRecord {
    return {
        id: String(row.uuid),
        importedSessionId: String(row.imported_session_uuid),
        kind: row.kind === 'instruction' ? 'instruction' : 'memory',
        content: String(row.content ?? ''),
        tags: safeJsonParse<string[]>(row.tags, []),
        source: row.source === 'llm' ? 'llm' : 'heuristic',
        metadata: safeJsonParse<Record<string, unknown>>(row.metadata, {}),
        createdAt: Number(row.created_at ?? 0),
    };
}

function mapSessionRow(row: Record<string, unknown>, parsedMemories: ImportedSessionMemoryRecord[]): ImportedSessionRecord {
    return {
        id: String(row.uuid),
        sourceTool: String(row.source_tool ?? ''),
        sourcePath: String(row.source_path ?? ''),
        externalSessionId: typeof row.external_session_id === 'string' ? row.external_session_id : null,
        title: typeof row.title === 'string' ? row.title : null,
        sessionFormat: String(row.session_format ?? 'generic'),
        transcript: String(row.transcript ?? ''),
        excerpt: typeof row.excerpt === 'string' ? row.excerpt : null,
        workingDirectory: typeof row.working_directory === 'string' ? row.working_directory : null,
        transcriptHash: String(row.transcript_hash ?? ''),
        normalizedSession: safeJsonParse<Record<string, unknown>>(row.normalized_session, {}),
        metadata: safeJsonParse<Record<string, unknown>>(row.metadata, {}),
        discoveredAt: Number(row.discovered_at ?? 0),
        importedAt: Number(row.imported_at ?? 0),
        lastModifiedAt: row.last_modified_at == null ? null : Number(row.last_modified_at),
        createdAt: Number(row.created_at ?? 0),
        updatedAt: Number(row.updated_at ?? 0),
        parsedMemories,
    };
}

export class ImportedSessionStore {
    hasTranscriptHash(transcriptHash: string): boolean {
        const row = sqliteInstance
            .prepare('SELECT uuid FROM imported_sessions WHERE transcript_hash = ? LIMIT 1')
            .get(transcriptHash) as Record<string, unknown> | undefined;

        return Boolean(row?.uuid);
    }

    upsertSession(input: ImportedSessionRecordInput): ImportedSessionRecord {
        const now = Date.now();
        const existing = sqliteInstance
            .prepare('SELECT uuid FROM imported_sessions WHERE transcript_hash = ? LIMIT 1')
            .get(input.transcriptHash) as Record<string, unknown> | undefined;

        const sessionId = typeof existing?.uuid === 'string' ? existing.uuid : crypto.randomUUID();
        const metadata = JSON.stringify(input.metadata ?? {});
        const normalizedSession = JSON.stringify(input.normalizedSession);

        sqliteInstance.prepare(`
            INSERT INTO imported_sessions (
                uuid,
                source_tool,
                source_path,
                external_session_id,
                title,
                session_format,
                transcript,
                excerpt,
                working_directory,
                transcript_hash,
                normalized_session,
                metadata,
                discovered_at,
                imported_at,
                last_modified_at,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(uuid) DO UPDATE SET
                source_tool = excluded.source_tool,
                source_path = excluded.source_path,
                external_session_id = excluded.external_session_id,
                title = excluded.title,
                session_format = excluded.session_format,
                transcript = excluded.transcript,
                excerpt = excluded.excerpt,
                working_directory = excluded.working_directory,
                transcript_hash = excluded.transcript_hash,
                normalized_session = excluded.normalized_session,
                metadata = excluded.metadata,
                discovered_at = excluded.discovered_at,
                imported_at = excluded.imported_at,
                last_modified_at = excluded.last_modified_at,
                updated_at = excluded.updated_at
        `).run(
            sessionId,
            input.sourceTool,
            input.sourcePath,
            input.externalSessionId ?? null,
            input.title ?? null,
            input.sessionFormat,
            input.transcript,
            input.excerpt ?? null,
            input.workingDirectory ?? null,
            input.transcriptHash,
            normalizedSession,
            metadata,
            input.discoveredAt,
            input.importedAt,
            input.lastModifiedAt ?? null,
            existing ? now : input.importedAt,
            now,
        );

        sqliteInstance
            .prepare('DELETE FROM imported_session_memories WHERE imported_session_uuid = ?')
            .run(sessionId);

        const insertMemory = sqliteInstance.prepare(`
            INSERT INTO imported_session_memories (
                uuid,
                imported_session_uuid,
                memory_index,
                kind,
                content,
                tags,
                source,
                metadata,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        input.parsedMemories.forEach((memory, index) => {
            insertMemory.run(
                crypto.randomUUID(),
                sessionId,
                index,
                memory.kind,
                memory.content,
                JSON.stringify(memory.tags ?? []),
                memory.source,
                JSON.stringify(memory.metadata ?? {}),
                now,
            );
        });

        const session = this.getImportedSession(sessionId);
        if (!session) {
            throw new Error(`Imported session '${sessionId}' was not persisted.`);
        }

        return session;
    }

    listImportedSessions(limit: number = 50): ImportedSessionRecord[] {
        const rows = sqliteInstance.prepare(`
            SELECT *
            FROM imported_sessions
            ORDER BY imported_at DESC
            LIMIT ?
        `).all(limit) as Record<string, unknown>[];

        return rows.map((row) => mapSessionRow(row, this.listParsedMemories(String(row.uuid))));
    }

    listParsedMemories(importedSessionId: string): ImportedSessionMemoryRecord[] {
        const rows = sqliteInstance.prepare(`
            SELECT *
            FROM imported_session_memories
            WHERE imported_session_uuid = ?
            ORDER BY memory_index ASC
        `).all(importedSessionId) as Record<string, unknown>[];

        return rows.map(mapMemoryRow);
    }

    getImportedSession(id: string): ImportedSessionRecord | null {
        const row = sqliteInstance.prepare(`
            SELECT *
            FROM imported_sessions
            WHERE uuid = ?
            LIMIT 1
        `).get(id) as Record<string, unknown> | undefined;

        if (!row) {
            return null;
        }

        return mapSessionRow(row, this.listParsedMemories(id));
    }

    listInstructionMemories(limit: number = 200): ImportedSessionMemoryRecord[] {
        const rows = sqliteInstance.prepare(`
            SELECT *
            FROM imported_session_memories
            WHERE kind = 'instruction'
            ORDER BY created_at DESC
            LIMIT ?
        `).all(limit) as Record<string, unknown>[];

        return rows.map(mapMemoryRow);
    }
}

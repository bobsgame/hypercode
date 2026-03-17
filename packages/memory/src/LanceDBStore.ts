import { connect } from '@lancedb/lancedb';
import { pipeline } from '@xenova/transformers';
import path from 'path';
import fs from 'fs';
import { IVectorStore } from './IVectorStore.js';

/**
 * LanceDB uses Apache Arrow for schema inference. Arrow cannot infer the element type
 * of an empty array (`[]`) or deeply-nested objects, causing runtime errors like:
 *   "Failed to infer data type for field structuredObservation.filesRead at row 0."
 * This helper serializes any array or object values to JSON strings so that every
 * top-level field in the row has a scalar type Arrow can handle, eliminating the error.
 * The serialized strings remain searchable as text and are preserved for later parsing.
 */
function sanitizeMetadataForArrow(metadata: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metadata)) {
        if (value === null || value === undefined) {
            result[key] = null;
        } else if (Array.isArray(value) || (typeof value === 'object')) {
            // Serialize arrays and objects to JSON strings to avoid Arrow inference failures
            result[key] = JSON.stringify(value);
        } else {
            result[key] = value;
        }
    }
    return result;
}

export class LanceDBStore implements IVectorStore {
    private dbPath: string;
    private db: any; // Type as any for now to avoid strict typing issues with lancedb
    private embedder: any;

    constructor(rootPath: string) {
        this.dbPath = path.join(rootPath, 'data', 'lancedb');
        if (!fs.existsSync(this.dbPath)) {
            fs.mkdirSync(this.dbPath, { recursive: true });
        }
    }

    async initialize() {
        console.log(`[VectorStore] Connecting to ${this.dbPath}...`);
        this.db = await connect(this.dbPath);

        console.log(`[VectorStore] Loading embedding model (Xenova/all-MiniLM-L6-v2)...`);
        // Use feature-extraction pipeline
        this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log(`[VectorStore] Ready.`);
    }

    async createEmbeddings(text: string): Promise<number[]> {
        if (!this.embedder) await this.initialize();
        const output = await this.embedder(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }

    async addMemory(content: string, metadata: any) {
        if (!this.db) await this.initialize();

        const embedding = await this.createEmbeddings(content);
        // LanceDB uses Apache Arrow for schema inference, which cannot infer the type of empty
        // arrays or nested objects. Sanitize metadata by serializing any non-scalar values
        // (arrays, objects) to JSON strings so Arrow only sees primitives at the top level.
        const sanitizedMeta = sanitizeMetadataForArrow(metadata);
        const data = [{
            vector: embedding,
            text: content,
            ...sanitizedMeta,
            timestamp: Date.now()
        }];

        let table;
        try {
            table = await this.db.openTable('memories');
            await table.add(data);
        } catch (e) {
            // Table doesn't exist, create it; schema is inferred from data.
            table = await this.db.createTable('memories', data);
        }
    }

    async addDocuments(docs: any[]) {
        if (!this.db) await this.initialize();
        if (docs.length === 0) return;

        // Create embeddings for batch if not present
        const processed = await Promise.all(docs.map(async d => {
            if (d.vector) return d;
            const text = d.text || d.content;
            return {
                ...d,
                vector: await this.createEmbeddings(text),
                timestamp: Date.now()
            };
        }));

        let table;
        try {
            table = await this.db.openTable('memories');
            await table.add(processed);
        } catch (e) {
            table = await this.db.createTable('memories', processed);
        }
    }

    async get(id: string) {
        if (!this.db) await this.initialize();
        try {
            const table = await this.db.openTable('memories');
            const results = await table.search(await this.createEmbeddings(''))
                .where(`id = '${id}'`)
                .limit(1)
                .toArray();
            return results.length > 0 ? results[0] : null;
        } catch (e) {
            return null;
        }
    }

    async delete(ids: string[]) {
        if (!this.db) await this.initialize();
        if (ids.length === 0) return;

        try {
            const table = await this.db.openTable('memories');
            const whereClause = ids.map(id => `id = '${id}'`).join(' OR ');
            await table.delete(whereClause);
        } catch (e) {
            console.error("VectorStore.delete failed:", e);
        }
    }

    async reset() {
        if (!this.db) await this.initialize();
        try {
            // Drop table
            await this.db.dropTable('memories');
        } catch (e) {
            // Ignore if doesn't exist
        }
    }

    async listDocuments(where?: string, limit: number = 100) {
        if (!this.db) await this.initialize();
        try {
            const table = await this.db.openTable('memories');
            // Hacky "find all" via empty vector search? No, LanceDB vector search is required.
            // Or use query() if supported?
            // Fallback: search with empty query embedding but high limit?
            // Actually, we can just use search() API with where clause.

            // NOTE: LanceDB usually requires a vector query for search, BUT we can iterate too.
            // Just use a dummy vector for standard listing sorted by... something?
            const dummyVec = await this.createEmbeddings('query');

            let queryBuilder = table.search(dummyVec).limit(limit);
            if (where) queryBuilder = queryBuilder.where(where);

            return await queryBuilder.toArray();
        } catch (e) {
            return [];
        }
    }

    async search(query: string, limit: number = 5, where?: string) {
        if (!this.db) await this.initialize();
        const queryVec = await this.createEmbeddings(query);

        const table = await this.db.openTable('memories');
        let queryBuilder = table.search(queryVec).limit(limit);

        if (where) {
            queryBuilder = queryBuilder.where(where);
        }

        return await queryBuilder.toArray();
    }
}

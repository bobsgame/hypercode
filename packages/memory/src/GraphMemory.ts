
/**
 * GraphMemory (Stub)
 * Implements Knowledge Graph patterns (Nodes/Edges) for structured memory.
 * Future integration target: Cognee / Neo4j / FalkorDB.
 */

export interface HelperNode {
    id: string;
    label: string;
    properties: Record<string, any>;
}

export interface HelperEdge {
    source: string;
    target: string;
    relation: string;
    weight: number;
}

import * as fs from 'fs';
import * as path from 'path';

export class GraphMemory {
    private nodes: Map<string, HelperNode> = new Map();
    private edges: HelperEdge[] = [];
    private persistPath: string | null = null;

    constructor(persistPath?: string) {
        if (persistPath) {
            this.persistPath = persistPath;
            this.load();
        }
    }

    private load() {
        if (this.persistPath && fs.existsSync(this.persistPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.persistPath, 'utf-8'));
                this.nodes = new Map(Object.entries(data.nodes || {}));
                this.edges = data.edges || [];
            } catch (e) {
                console.error("[GraphMemory] Failed to load graph:", e);
            }
        }
    }

    private save() {
        if (this.persistPath) {
            const data = {
                nodes: Object.fromEntries(this.nodes),
                edges: this.edges
            };
            fs.mkdirSync(path.dirname(this.persistPath), { recursive: true });
            fs.writeFileSync(this.persistPath, JSON.stringify(data, null, 2));
        }
    }

    async addNode(id: string, label: string, props: Record<string, any> = {}) {
        this.nodes.set(id, { id, label, properties: props });
        this.save();
    }

    async addEdge(source: string, target: string, relation: string) {
        this.edges.push({ source, target, relation, weight: 1.0 });
        this.save();
    }

    async getRelated(nodeId: string): Promise<HelperNode[]> {
        const relatedIds = this.edges
            .filter(e => e.source === nodeId)
            .map(e => e.target);

        return relatedIds
            .map(id => this.nodes.get(id))
            .filter((n): n is HelperNode => !!n);
    }
}

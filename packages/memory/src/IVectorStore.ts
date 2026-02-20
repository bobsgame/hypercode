export interface IVectorStore {
    initialize(): Promise<void>;
    createEmbeddings(text: string): Promise<number[]>;
    addMemory(content: string, metadata: any): Promise<boolean>;
    addDocuments(docs: any[]): Promise<boolean | void>;
    get(id: string): Promise<any | null>;
    delete(ids: string[]): Promise<void>;
    reset(): Promise<void>;
    listDocuments(where?: string, limit?: number): Promise<any[]>;
    search(query: string, limit?: number, where?: string): Promise<any[]>;
}

declare module 'insforge' {
    export class InsForge {
        constructor(config: { project: string; apiKey: string });
        database(): InsForgeDatabase;
    }

    export interface InsForgeDatabase {
        collection(name: string): InsForgeCollection;
    }

    export interface InsForgeCollection {
        doc(id: string): InsForgeDoc;
        where(field: string, op: string, value: any): InsForgeCollection;
        onSnapshot(callback: (snapshot: any) => void, onError?: (error: any) => void): () => void;
    }

    export interface InsForgeDoc {
        set(data: any, options?: { merge: boolean }): Promise<void>;
    }
}

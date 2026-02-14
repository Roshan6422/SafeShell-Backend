import { db, firebaseInitialized } from '../../config/firebase';
import { CollectionReference, DocumentData, QuerySnapshot } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

export interface IFirestoreDocument {
    _id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    [key: string]: any;
}

// ─── In-Memory Store (fallback when Firebase is not available) ─────────
let inMemoryStore: { [collection: string]: { [id: string]: any } } = {};
let idCounter = 1;
let loadedFromDisk = false;
const DB_FILE = path.join(process.cwd(), 'temp_db.json');

function saveToDisk() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify({ inMemoryStore, idCounter }, null, 2));
    } catch (e) {
        console.error('Failed to save in-memory DB to disk:', e);
    }
}

function loadFromDisk() {
    if (loadedFromDisk) return;
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            inMemoryStore = data.inMemoryStore || {};
            idCounter = data.idCounter || 1;
            console.log('✅ Loaded in-memory DB from disk');
        }
    } catch (e) {
        console.error('Failed to load in-memory DB from disk:', e);
    } finally {
        loadedFromDisk = true;
    }
}

function getMemoryCollection(name: string): { [id: string]: any } {
    loadFromDisk();
    if (!inMemoryStore[name]) {
        inMemoryStore[name] = {};
    }
    return inMemoryStore[name];
}

// ──────────────────────────────────────────────────────────────────────

export class FirestoreModel {
    protected static collectionName: string;
    public _id?: string;
    public createdAt?: Date;
    public updatedAt?: Date;

    constructor(data: any) {
        Object.assign(this, data);
    }

    // ─── Firestore Methods ────────────────────────────────────────────

    static getCollection(): CollectionReference {
        if (!firebaseInitialized || !db) {
            throw new Error('Firebase not initialized');
        }
        return db.collection(this.collectionName);
    }

    // ─── Static Query Methods (with fallback) ─────────────────────────

    static async findOne(query: { [key: string]: any }): Promise<any | null> {
        if (!firebaseInitialized) {
            return this._memFindOne(query);
        }

        let ref: any = this.getCollection();

        for (const [key, value] of Object.entries(query)) {
            if (key === '_id') {
                const doc = await this.getCollection().doc(value).get();
                return doc.exists ? new this({ _id: doc.id, ...doc.data() }) : null;
            }
            ref = ref.where(key, '==', value);
        }

        const snapshot: QuerySnapshot = await ref.limit(1).get();
        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return new this({ _id: doc.id, ...doc.data() });
    }

    static async findById(id: string): Promise<any | null> {
        if (!firebaseInitialized) {
            return this._memFindById(id);
        }
        const doc = await this.getCollection().doc(id).get();
        if (!doc.exists) return null;
        return new this({ _id: doc.id, ...doc.data() });
    }

    static async find(query: { [key: string]: any } = {}, sortOptions: { [key: string]: 'asc' | 'desc' | 1 | -1 } = {}): Promise<any[]> {
        if (!firebaseInitialized) {
            return this._memFind(query);
        }

        let ref: any = this.getCollection();

        for (const [key, value] of Object.entries(query)) {
            ref = ref.where(key, '==', value);
        }

        for (const [key, value] of Object.entries(sortOptions)) {
            const direction = (value === 'desc' || value === -1) ? 'desc' : 'asc';
            ref = ref.orderBy(key, direction);
        }

        const snapshot: QuerySnapshot = await ref.get();
        return snapshot.docs.map(doc => new this({ _id: doc.id, ...doc.data() }));
    }

    static async create(data: any): Promise<any> {
        if (!firebaseInitialized) {
            return this._memCreate(data);
        }

        const timestamp = new Date();
        const dataToSave = {
            ...data,
            createdAt: timestamp,
            updatedAt: timestamp
        };

        const docRef = await this.getCollection().add(dataToSave);
        return new this({ _id: docRef.id, ...dataToSave });
    }

    static async deleteMany(query: { [key: string]: any }): Promise<void> {
        if (!firebaseInitialized) {
            return this._memDeleteMany(query);
        }

        let ref: any = this.getCollection();
        for (const [key, value] of Object.entries(query)) {
            ref = ref.where(key, '==', value);
        }
        const snapshot = await ref.get();

        const batch = db!.batch();
        snapshot.docs.forEach((doc: any) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }

    // ─── Instance Methods (with fallback) ─────────────────────────────

    async save(): Promise<this> {
        if (!firebaseInitialized) {
            return this._memSave();
        }

        const dataToSave = { ...this } as any;
        delete dataToSave._id;

        dataToSave.updatedAt = new Date();
        this.updatedAt = dataToSave.updatedAt;

        const collection = (this.constructor as any).getCollection();

        if (this._id) {
            await collection.doc(this._id).set(dataToSave, { merge: true });
        } else {
            dataToSave.createdAt = new Date();
            this.createdAt = dataToSave.createdAt;
            const docRef = await collection.add(dataToSave);
            this._id = docRef.id;
        }
        return this;
    }

    async deleteOne(): Promise<void> {
        if (!firebaseInitialized) {
            return this._memDeleteOne();
        }
        if (this._id) {
            await (this.constructor as any).getCollection().doc(this._id).delete();
        }
    }

    toJSON() {
        return { ...this };
    }

    // ═══════════════════════════════════════════════════════════════════
    // In-Memory Fallback Implementations
    // ═══════════════════════════════════════════════════════════════════

    private static _memFindOne(query: { [key: string]: any }): any | null {
        const col = getMemoryCollection(this.collectionName);
        for (const [id, doc] of Object.entries(col)) {
            if (query['_id'] && id === query['_id']) {
                return new this({ _id: id, ...doc });
            }
            let match = true;
            for (const [key, value] of Object.entries(query)) {
                if (key === '_id') continue;
                if (doc[key] !== value) { match = false; break; }
            }
            if (match) return new this({ _id: id, ...doc });
        }
        return null;
    }

    private static _memFindById(id: string): any | null {
        const col = getMemoryCollection(this.collectionName);
        const doc = col[id];
        if (!doc) return null;
        return new this({ _id: id, ...doc });
    }

    private static _memFind(query: { [key: string]: any } = {}): any[] {
        const col = getMemoryCollection(this.collectionName);
        const results: any[] = [];
        for (const [id, doc] of Object.entries(col)) {
            let match = true;
            for (const [key, value] of Object.entries(query)) {
                if (doc[key] !== value) { match = false; break; }
            }
            if (match) results.push(new this({ _id: id, ...doc }));
        }
        return results;
    }

    private static _memCreate(data: any): any {
        const col = getMemoryCollection(this.collectionName);
        const id = `mem_${idCounter++}`;
        const timestamp = new Date();
        const doc = { ...data, createdAt: timestamp, updatedAt: timestamp };
        col[id] = doc;
        saveToDisk();
        return new this({ _id: id, ...doc });
    }

    private static _memDeleteMany(query: { [key: string]: any }): void {
        const col = getMemoryCollection(this.collectionName);
        let changed = false;
        for (const [id, doc] of Object.entries(col)) {
            let match = true;
            for (const [key, value] of Object.entries(query)) {
                if (doc[key] !== value) { match = false; break; }
            }
            if (match) {
                delete col[id];
                changed = true;
            }
        }
        if (changed) saveToDisk();
    }

    private _memSave(): this {
        const collectionName = (this.constructor as any).collectionName;
        const col = getMemoryCollection(collectionName);
        const data = { ...this } as any;
        delete data._id;

        data.updatedAt = new Date();
        this.updatedAt = data.updatedAt;

        if (this._id) {
            col[this._id] = { ...(col[this._id] || {}), ...data };
        } else {
            const id = `mem_${idCounter++}`;
            data.createdAt = new Date();
            this.createdAt = data.createdAt;
            col[id] = data;
            this._id = id;
        }
        saveToDisk();
        return this;
    }

    private _memDeleteOne(): void {
        if (this._id) {
            const collectionName = (this.constructor as any).collectionName;
            const col = getMemoryCollection(collectionName);
            if (col[this._id]) {
                delete col[this._id];
                saveToDisk();
            }
        }
    }
}

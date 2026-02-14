import { FirestoreModel } from './firebase/FirestoreModel';

export interface IVaultItem {
    user: string; // Storing userId as string
    name: string;
    type: 'photo' | 'video' | 'document' | 'zip' | 'note';
    size: string;
    url?: string;
    content?: string;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
}

export class VaultItem extends FirestoreModel {
    static collectionName = 'vaultItems';

    public user!: string;
    public name!: string;
    public type!: string;
    public size!: string;
    public url?: string;
    public content?: string;
    public isDeleted!: boolean;
    public deletedAt?: Date;

    constructor(data: any) {
        super(data);
    }
}

export default VaultItem;

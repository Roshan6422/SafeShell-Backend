import mongoose, { Schema, Document } from 'mongoose';

export interface IVaultItem extends Document {
    user: mongoose.Schema.Types.ObjectId;
    name: string;
    type: 'photo' | 'video' | 'document' | 'zip' | 'note';
    size: string;
    url?: string;
    content?: string; // For notes or passwords
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
}

const VaultItemSchema: Schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['photo', 'video', 'document', 'zip', 'note'], required: true },
    size: { type: String, required: true },
    url: { type: String },
    content: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IVaultItem>('VaultItem', VaultItemSchema);

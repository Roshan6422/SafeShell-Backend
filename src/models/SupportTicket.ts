import mongoose, { Document, Schema } from 'mongoose';

export interface IReply {
    sender: 'user' | 'admin';
    message: string;
    date: Date;
}

export interface ISupportTicket extends Document {
    user: mongoose.Types.ObjectId;
    subject: string;
    message: string;
    status: 'open' | 'closed';
    replies: IReply[];
    createdAt: Date;
}

const SupportTicketSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    replies: [{
        sender: { type: String, enum: ['user', 'admin'], required: true },
        message: { type: String, required: true },
        date: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);

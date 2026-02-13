import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
    user: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    status: string;
    date: Date;
    transactionId?: string;
    paymentMethod?: string;
    plan?: string;
    orderId?: string;
}

const PaymentSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'LKR' },
    status: { type: String, default: 'pending' },
    date: { type: Date, default: Date.now },
    transactionId: { type: String },
    paymentMethod: { type: String },
    plan: { type: String },
    orderId: { type: String, unique: true, sparse: true }
});

export default mongoose.model<IPayment>('Payment', PaymentSchema);


import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password?: string;
    googleId?: string;
    name: string;
    createdAt: Date;
    resetOtp?: string;
    resetOtpExpire?: Date;
    calculatorPassword?: string;
    recoveryKey?: string;
    role: 'user' | 'admin';
    subscriptionStatus: 'free' | 'pro';
    subscriptionExpiry?: Date;
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    // 🔽 Forgot password fields
    resetOtp: { type: String },
    resetOtpExpire: { type: Date },
    calculatorPassword: { type: String },
    recoveryKey: { type: String }, // New field for account recovery
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    subscriptionStatus: { type: String, enum: ['free', 'pro'], default: 'free' },
    subscriptionExpiry: { type: Date },
});

export default mongoose.model<IUser>('User', UserSchema);
